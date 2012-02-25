var Structr = require('structr'),
utils = require('./utils'),
Transactions = require('./transactions'),
vine = require('vine'),
_ = require('underscore'),
beanpoll = require('beanpoll'),
crema = require('crema'),
logger = require('winston').loggers.get('daisy'),
sprintf = require('sprintf').sprintf,
EventEmitter = require('events').EventEmitter;

var Response = {
	next: 'next',
	response: 'response'
}

var Request = {
	body: 'body'
}


function cleanPath(path) {
	
	return path.replace(/^\/+|\/+$/,'');

}

 
var TransportWrapper = Structr({
	
	/**
	 */
	
	'__construct': function(collection, transport, name) {

		this._em = new EventEmitter();
		this._em.setMaxListeners(0);

		this.name = name;

		//the collection that holds all the transports
		this._collection = collection;

		//the scope of queues to bind to
		this.scope = collection.scope || [];

		
		//the router that handles all the path requests
		this._router = collection._router;
		
		//the transport which broadcasts routes over the network
		this._transport = transport;
		
		//paths we've already hooked into
		this._hooked = {};

		this._remoteRouters = {};

		
		//any paths which should be ignored. This is a dirty method of making sure requests
		//don't get re-broadcasted out to the same transport
		this._ignore = {};
		
		//controls transactions between two servers
		this._transactions = new Transactions(transport);


		//kill transactions after N seconds
		this._killTimeout = 1000 * 20;
		
		//called back when the app first starts up, and when new apps are introduced
		transport.onHandshake = this.getMethod('onHandshake');
		
		//called when an app on the network is sending a request that *this* app can handle
		transport.onMessage = this.getMethod('onMessage');
		
		//what happens when a call is made to a path that doens't exist
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
	 */

	'on': function(type, callback) {
		this._em.on(type, callback);
	},

	/**
	 */

	'once': function(type, callback) {
		this._em.once(type, callback);
	},
	
	/**
	 * publishes *public* hooks to the network. Any app can call these.
	 */
	
	'publishHooks': function(hooks) {

		var self = this;
		
		hooks.forEach(function(hook) {


			self._hooked[cleanPath(utils.generalizeParams(hook.path))]  = 1;

			logger.verbose(sprintf('publish hook %s', hook.path));
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
		this._em.emit('connect');
	},
	
	/**
	 * handle any message from a server
	 */
	
	'onMessage': function(data, headers, from) {

		if(headers.type in Response) {

			this._onResponse(data, headers, from);

		} else {

			this._ignore[headers.path] = 1;
			this._onRequest(data, headers, from);
			delete this._ignore[headers.path];

		}
	},
	
	/**
	 */
	
	'onNoRoute': function(path) {      
	                             

		(this._transactions.live(path) || []).forEach(function(transaction) {

			transaction.emit('response', { error: 'Route ' + path + ' does not exist' });

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

			self._transport.direct(from.replyTo, response, { transactionId: headers.transactionId, type: type } );
		};


		logger.verbose(sprintf('hooked %s %s', headers.type.toUpperCase(), headers.path));


		var req = this._router.request(headers.path).

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
			
			logger.verbose(sprintf('path %s does not exist', headers.path));

			respond({ error: new Error('route does not exist') }, Response.response);
			return;
		}


		if(headers.hasNext) {

			req.next(function() {

				respond(null, Request.next);

			})
		}

		req.dispatch().end(payload.data);

		
	},        
	
	
	/**
	 */
	
	'_from': function(from) {
	                   	
		var queue = from.name,
		replyTo = from.replyTo;
		              
		var transactions = this._transactions, self = this;

		if(this._remoteRouters[replyTo]) return this._remoteRouters[replyTo];



		var router = /*this._remoteRouters[replyTo] =*/ beanpoll.router();
		router.use(this._router.using());
		router.name = replyTo;



		Object.keys(this._hooked).forEach(function(path) {

			Object.keys(router.directors).forEach(function(type) {

				router.on(path, { type: type }, function(req, res, mw) {
							
					var mw = this,
					msg = mw.request;

					self._dispatch(mw, type, crema.stringifySegments(mw.current.path.segments, mw.current.params), replyTo);
				});

			})
		});

		//only keep the remote router for so long
		/*setTimeout(function() {
			
			delete self._remoteRouters[replyTo];

		}, 1000 * 60);*/

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
	 */
	 
	'_transaction': function(headers) {

		var trans = this._transactions.live(headers.transactionId);


		//this WILL happen when fanouts are acknowledged, such as push.
		if(!trans) return null;//console.error('Transaction %s does not exist', headers.transactionId);

		return trans;
		
	},

	/**
	 */

	'_getQueue': function(path) {

		if(!this.scope.length) return null;

		var queues = this._hooked[path] || [];

		return _.intersection(queues, this.scope);
	},
	
	/**
	 * hooks a *remote* route to the app
	 */
	
	'_hook': function(route, types, queues) {

		var path;

		if(typeof path == 'object') {
			types = [route.type];
			path = route.path;
		} else {
			path = route;
		}

		if(!types) types = [];
		if(!queues) queues = [];


		path = cleanPath(path);

		
		//router
		var r        = this._router,

		//routes to ignore - incomming remote calls are ignored
		ignore       = this._ignore,

		//transport to use - JSONP? AMQP?
		transport    = this._transport,

		//transactions ~ push/pull 
		transactions = this._transactions,

		self = this;

		this._hooked[path] = queues || [];


		
		try {

			var pathExpr = crema.parsePath(path);


			types.forEach(function(type) {

				var director = r.director(type),
				req = r.request(path).type(type),
				hasListener = req.exists(),
				hasPrivate = req.tag('private', true).exists();


				if(hasPrivate || (hasListener && !director.passive)) return;

				// if(hasPrivate || (r.routeExists({ path: channelExpr }) && (!hasListener || director.passive))) return;


				logger.verbose(sprintf('hooking %s %s', type, path));
				
				r.on(path, { tags: { hooked: '*', unfilterable: '*', stream: true, priority: -999999 }, type: type }, function(req, res) {

					var mw = this, 
					msg = mw.request,
					params = msg.params;

					path = crema.stringifySegments(mw.current.path.segments, mw.current.params);

					if(msg.from != self._router || msg.headers.ignoreHook) {
						throw new Error('cannot proxy "' + path + '" request');
					}


					self._dispatch(mw, type, path, msg.headers.queue || self._getQueue(path));
				});

			});

		} catch(e) {
			logger.error(e, { stack: e.stack });
		}


		

	},


	'_dispatch': function(mw, type, path, queue) {
		
		var msg = mw.request, self = this;


		logger.verbose(sprintf('remote %s %s', type.toUpperCase(), path))


		function respond(err, result) {

			if(mw.response.sentHeaders) return;

			if(err) logger.error(err, { stack: err.stack });

			if(err) return mw.response.error(new Error(err.message));

			mw.response.end(result);

		}

		function onData(err, result) {

			if(err) return respond(err);


			var transaction = self._transactions.
			create(path).
			prepare(type, {
				queue: queue,
				tags: msg.filter, //check this tomorrow Friday, February 03, 2012
				payload: {
					data: result || true,
					query: Structr.copy(self._collection._stickyData, msg.query, true),
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
				respond(new Error('Could not send '+path+'. Most likely a target was not set.'));
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

		wrapper.publishHooks(utils.siftPaths(this._router));

		return wrapper;
	}
});