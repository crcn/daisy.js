var Structr = require('structr'),
utils = require('./utils'),
Transactions = require('./transactions'),
vine = require('vine');


var TransportWrapper = Structr({
	
	/**
	 */
	
	'__construct': function(collection, transport)
	{
		
		//the collection that holds all the transports
		this._collection = collection;
		
		//the router that handles all the channel requests
		this._router = collection._router;
		
		//the transport which broadcasts routes over the network
		this._transport = transport;
		
		//channels we've already hooked into
		this._hooked = {};
		
		//any channels which should be ignored. This is a dirty method of making sure requests
		//don't get re-broadcasted out to the same transport
		this._ignore = {};
		
		//controls transactions between two servers
		this._transactions = new Transactions(transport);
		
		
		//called back when the app first starts up, and when new apps are introduced
		transport.onHandshake = this.getMethod('onHandshake');
		
		//called when an app on the network is sending a request that *this* app can handle
		transport.onMessage = this.getMethod('onMessage');
		
		//what happens when a call is made to a channel that doens't exist
		transport.onNoRoute = this.getMethod('onNoRoute');
	},
	
	/**
	 * publishes *public* hooks to the network. Any app can call these.
	 */
	
	'publishHooks': function(hooks)
	{
		var self = this;
		
		hooks.forEach(function(hook)
		{
			self._hooked[hook.replace(/\:\w+/g,':param')]  = 1;
		});
		
		this._transport.publishHooks(hooks);
	},
	
	/**
	 * When new apps come in, register their hooks
	 */
	
	'onHandshake': function(handshake)
	{
		var self = this;
		
		handshake.hooks.forEach(this.getMethod('_hook'));
		
		
		//notify the rest of the app that the given apps are ready
		handshake.apps.forEach(function(app)
		{
			self._router.push(app + '/ready');
		});
		
	},
	
	/**
	 * handle any message from a server
	 */
	
	'onMessage': function(data, headers, from)
	{
		
		//request coming from a server
		if(headers.type == 'push' || headers.type == 'pull')
		{
			this._ignore[headers.channel] = 1;
			this._onRequest(data, headers, from);
			delete this._ignore[headers.channel];
		}
		
		//OR a response from a server ~ response, or next
		else
		{
			this._onResponse(data, headers, from);
		}
	},
	
	/**
	 */
	
	'onNoRoute': function(channel)
	{
		(this._transactions.live(channel) || []).forEach(function(transaction)
		{
			transaction.emit('response', vine.error('Route does not exist').result({ connection: false}).end());
		});
	},
	
	/**
	 */
	
	'_onRequest': function(data, headers, from)
	{
		var ops = {},
		self = this,
		respond = function(response, type)
		{
			self._transport.direct(from.name, response, { transactionId: headers.transactionId, type: type } );
			
			// queue.shift();
		};
		
		//this happens when passing through a route like: 'pull some/remote/route -> some/local/route'
		if(headers.hasNext)
		{
			ops._next = function()
			{
				respond(null, 'next');
			}
		}
		
		if(headers.type == 'push')
		{
			this._router.push(headers.channel, data, ops);
		}
		else
		if(headers.type == 'pull')
		{
			self._router.pull(headers.channel, data, ops, function(response)
			{
				respond(response, 'response');
			});
		}
		
	},
	
	/**
	 */
	
	'_onResponse': function(data, headers, from)
	{
		var trans = this._transactions.live(headers.transactionId);
		
		if(!trans) return console.error('Transaction %s does not exist', headers.transactionId);
		
		trans.emit(headers.type, data);
		
		trans.dispose();
	},
	
	/**
	 * hooks a *remote* route to the app
	 */
	
	'_hook': function(channel)
	{
		//no "ready" hooks. This is FUGLY. 
		if(channel.match(/^[^\/]+\/ready$/) || this._hooked[channel]) return;
		
		this._hooked[channel] = 1;
		
		var r = this._router,
		transport = this._transport,
		transactions = this._transactions,
		ignore = this._ignore;
		
		try
		{
			r.on('pull -hooked ' + channel, function(request)
			{
				if(ignore[request.currentChannel]) return;
				
				transactions.create(request.currentChannel).register().send('pull', request).on('response', function(response)
				{
					request.end(response);
				});
			});
			
			r.on('push -hooked ' + channel, function(data)
			{
				if(ignore[this.currentChannel]) return;
				
				transactions.create(this.currentChannel).send('push', this);
			});
		}
		
		//probably already exists
		catch(e)
		{
			console.warn('Unable to hook %s', channel);
		}
	}
});


module.exports = Structr({
	
	/**
	 */
	
	'__construct': function(router)
	{
		this._router = router;
		this._transports = [];
	},
	
	/**
	 */
	
	'publishHooks': function(hooks)
	{
		this._transports.forEach(function(transport)
		{
			transport.publishHooks(hooks);
		});
	},
	
	/**
	 */
	
	'add': function(transport)
	{
		var wrapper = new TransportWrapper(this, transport);
		
		this._transports.push(wrapper);
		
		//TODO: public hooks should be dynamic
		wrapper.publishHooks(utils.publicChannels(this._router.channels()));
	}
});