var Structr = require('structr'),
utils = require('./utils'),
Transactions = require('./transactions'),
vine = require('vine'),
_ = require('underscore'),
beanpoll = require('beanpoll'),
crema = require('crema'),
logger = require('winston').loggers.get('daisy'),
sprintf = require('sprintf').sprintf;

var Response = {
	next: 'next',
	response: 'response'
}

var Request = {
	body: 'body'
}


function cleanChannel(channel) {
	
	return channel.replace(/^\/+|\/+$/,'');

}

 
var TransportWrapper = Structr({
	
	/**
	 */
	
	'__construct': function(collection, transport, name) {

		this.name = name;

		//the collection that holds all the transports
		this._collection = collection;

		//the scope of queues to bind to
		this.scope = collection.scope || [];

		
		//the router that handles all the channel requests
		this._router = collection._router;
		
		//the transport which broadcasts routes over the network
		this._transport = transport;
		
		//channels we've already hooked into
		this._hooked = {};

		this._remoteRouters = {};

		
		//any channels which should be ignored. This is a dirty method of making sure requests
		//don't get re-broadcasted out to the same transport
		this._ignore = {};
		
		//controls transactions between two servers
		this._transactions = new Transactions(transport);

		this._requests = {};

		//kill transactions after N seconds
		this._killTimeout = 1000 * 20;
		
		//called back when the app first starts up, and when new apps are introduced
		transport.onHandshake = this.getMethod('onHandshake');
		
		//called when an app on the network is sending a request that *this* app can handle
		transport.onMessage = this.getMethod('onMessage');
		
		//what happens when a call is made to a channel that doens't exist
		transport.onNoRoute = this.getMethod('onNoRoute');

		//
		transport.onConnected = this.getMethod('onConnected');

		transport.onDisconnected = this.getMethod('onDisconnected');

		var self = this;

		this._router.on('push -hook announce/:appName', function() {

			this.from.request(name + '/ready').push(undefined);
		});

		this._router.on('pull ' + name + '/ready', function(req, res) {
			res.end();
		});

	},
	
	/**
	 * publishes *public* hooks to the network. Any app can call these.
	 */
	
	'publishHooks': function(hooks) {

		var self = this;
		
		hooks.forEach(function(hook) {


			self._hooked[cleanChannel(utils.generalizeParams(hook.channel))]  = 1;

			logger.verbose(sprintf('publish hook %s', hook.channel));
		});
		
		this._transport.publishHooks(hooks);
	},
	
	/**
	 * When new apps come in, register their hooks
	 */
	
	'onHandshake': function(handshake) {                           
		var self = this;



		if(handshake.hooks instanceof Array) {

			handshake.hooks.forEach(function(hook) {
				self._hook(hook);
			});

		} else {

			for(var route in handshake.hooks) {

				var info = handshake.hooks[route];

				self._hook(route, info.t, info.a);	
					
			}

		}
	},

	/**
	 */
	'onDisconnected': function() {
	},

	/**
	 */

	'onConnected': function() {
		//TODO - push reconnect
		if(this._announced) return;
		this._announced = true;


		this._router.request('announce/' + this.name).push(undefined);
	},
	
	/**
	 * handle any message from a server
	 */
	
	'onMessage': function(data, headers, from) {

		if(headers.type in Response) {

			this._onResponse(data, headers, from);

		} /*else
		if(headers.type in Request) {

			this._onRequestPart(data, headers, from);
			
		}*/ else {

			this._ignore[headers.channel] = 1;
			this._onRequest(data, headers, from);
			delete this._ignore[headers.channel];

		}
	},
	
	/**
	 */
	
	'onNoRoute': function(channel) {      
	                             

		(this._transactions.live(channel) || []).forEach(function(transaction) {

			transaction.emit('response', { error: 'Route ' + channel + ' does not exist' });

		});
	},
	
	/**
	 */
	
	'_onRequest': function(payload, headers, from)
	{           
		var self = this,
		fromRouter = this._from(from),
		responded = false,
		respond = function(response, type) {

			//this WILL happen on items such as push routes
			if(responded) return;
			responded = true;

			delete self._requests[headers.transactionId];
			self._transport.direct(from.replyTo, response, { transactionId: headers.transactionId, type: type } );
		};

		logger.verbose(sprintf('hooked %s %s', headers.type.toUpperCase(), headers.channel));


		var req = this._router.request(headers.channel).

		//type of route: push, pull, collect, etc.
		type(headers.type).

		//point back to the remote router
		from(fromRouter).

		headers(payload.headers).

		query(payload.query).

		//only hooked items can be processed
		tag('hook', true).

		//the ack callback
		response(function(err, data) {

			//some errors CANNOT be serialized for some reason
			respond({ error: err ? { message: err.message, stack: err.stack } : null, data: data ? data : null }, Response.response);

		});


		//this happens with services such as rabbitmq where you might
		//have a CLUSTER of applications which use the same queues
		if(from.isSelf) {

			respond({ error: new Error('cannot handle self') }, Response.response);
			return;
		}

		if(!req.hasListeners()) {
			
			logger.debug(sprintf('channel %s does not exist', headers.channel));

			respond({ error: new Error('route does not exist') }, Response.response);
			return;
		}


		if(headers.hasNext) {

			req.next(function() {

				respond(null, Request.next);

			})
		}

		self._requests[ headers.transactionId ] = req.dispatch().end(payload.data);

		
	},        
	
	
	/**
	 */
	
	'_from': function(from) {
	                   
		var queue = from.name,
		replyTo = from.replyTo;
		              
		var transactions = this._transactions, self = this;

		if(this._remoteRouters[replyTo]) return this._remoteRouters[replyTo];


		var router = this._remoteRouters[replyTo] = beanpoll.router();
		router.use(this._router.using());
		router.name = replyTo;


		Object.keys(this._hooked).forEach(function(channel) {

			Object.keys(router.directors).forEach(function(type) {

				router.on(channel, { type: type }, function(req, res, mw) {
							
					var mw = this,
					msg = mw.message;

					self._dispatch(mw, type, crema.stringifyPaths(mw.current.channel.paths, mw.current.params), replyTo);
				});

			})
		});

		return router;
	},
	
	/**
	 */
	
	'_onResponse': function(data, headers, from) {

		var trans = this._transaction(headers);

		if(!trans) return;
		
		trans.emit(headers.type, data);      
	},

	/**
	 * this will NOT WORK because rabbitmq will round-robin this shit
	 */

	/*'_onRequestPart': function(data, headers, from) {
		
		var req = this._requests[headers.transactionId];

		if(!req) return console.error('Request ID %s does not exist', headers.transactionId);

		if(headers.type == 'body') {

			req.end(data);

		} else
		if(headers.type == 'write') {
			//TODO
		} else
		if(headers.type == 'end') {
			//TODO
		}

	},*/
	
	/**
	 */
	 
	'_transaction': function(headers) {

		var trans = this._transactions.live(headers.transactionId);


		//this WILL happen when fanouts are acknowledged, such as push.
		if(!trans) return null;//console.error('Transaction %s does not exist', headers.transactionId);

		return trans;
		
	},

	/**
	 */

	'_getQueue': function(channel) {

		if(!this.scope.length) return null;

		var queues = this._hooked[channel] || [];

		return _.intersection(queues, this.scope);
	},
	
	/**
	 * hooks a *remote* route to the app
	 */
	
	'_hook': function(channel, types, queues) {

		if(!types) types = [];
		if(!queues) queues = [];


		channel = cleanChannel(channel);

		
		//router
		var r        = this._router,

		//routes to ignore - incomming remote calls are ignored
		ignore       = this._ignore,

		//transport to use - JSONP? AMQP?
		transport    = this._transport,

		//transactions ~ push/pull 
		transactions = this._transactions,

		//data that should be sent back and forth whenever there's a request
		stickyData   = this._collection._stickyData,

		self = this;

		this._hooked[channel] = queues || [];


		
		try {

			var channelExpr = crema.parseChannel(channel);

			types.forEach(function(type) {

				var director = r.directors[type];
				
				var hasListener = director.routeExists({ channel: channelExpr }),
				hasPrivate = director.routeExists({ channel: channelExpr, tags: { "private": true }})

				if(hasPrivate || (hasListener && !director.passive)) return;

				// if(hasPrivate || (r.routeExists({ channel: channelExpr }) && (!hasListener || director.passive))) return;

				// console.log(hasListener+" "+director.passive)

				logger.debug(sprintf('hooking %s %s', type, channel));
				
				r.on(channel, { tags: { hooked: '*', unfilterable: '*', stream: true }, type: type }, function(req, res) {

					var mw = this, 
					msg = mw.message,
					params = msg.params,
					paths = [];

					path = crema.stringifyPaths(mw.current.channel.paths, mw.current.params);

					if(msg.from != self._router || msg.headers.ignoreHook) return res.error(new Error('cannot proxy "' + path + '" request'));

					Structr.copy(self.stickyData, msg.query, true);  

					self._dispatch(mw, type, path, msg.headers.queue || self._getQueue(channel));
				});

			});

		} catch(e) {
			logger.error(e);
		}


		

	},


	'_dispatch': function(mw, type, channel, queue) {
		
		var msg = mw.message, self = this;


		function respond(err, result) {

			if(mw.response.sentHeaders) return;

			if(err) logger.error(err)

			if(err) return mw.response.error(new Error(err.message));

			mw.response.end(result);

		}

		function onData(err, result) {

			if(err) return respond(err);

			var transaction = self._transactions.
			create(channel).
			prepare(type, {
				queue: queue,
				payload: {
					data: result || true,
					query: msg.query,
					headers: msg.headers
				},
				hasNext: mw.hasNext,
				next: function() {
					mw.next()
				}
			}).
			register({ timeout: self._killTimeout });


			transaction.onEnd('response', function(response) {

				respond(response.error, response.data);

			});		

			var success = transaction.send();


			//probably out of scope
			if(!success) {
				transaction.dispose();
				respond(new Error('Could not send'));
			}
		}

		//dump incomming data - we CANNOT pipe it over the network
		//since some transports don't support it, such as rabbitmq. With rabbit,
		//piping data will be round-robbined around queues. 
		//msg.dump(onData);

		onData();
	}
});


module.exports = Structr({
	
	/**
	 */
	
	'__construct': function(router, scope, remoteName) {

		this.remoteName = remoteName;
		this._router = router;
		this._transports = [];
		this._stickyData = {}
		this.scope = scope;

	},
	
	/**
	 */
	
	'addStickyData': function(data) {

		Structr.copy(data || {}, this._stickyData, true);

	},
	
	/**
	 */
	
	'publishHooks': function(hooks) {

		this._transports.forEach(function(transport) {

			transport.publishHooks(hooks);

		});
	},
	
	/**
	 */
	
	'add': function(transport) {

		var wrapper = new TransportWrapper(this, transport, this.remoteName);
		
		this._transports.push(wrapper);

		wrapper.publishHooks(utils.siftChannels(this._router));

	}
});