var Structr = require('structr'),
utils = require('./utils'),
Transactions = require('./transactions'),
vine = require('vine'),
_ = require('underscore');

 
var TransportWrapper = Structr({
	
	/**
	 */
	
	'__construct': function(collection, transport)
	{
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
		
		//any channels which should be ignored. This is a dirty method of making sure requests
		//don't get re-broadcasted out to the same transport
		this._ignore = {};
		
		//controls transactions between two servers
		this._transactions = new Transactions(transport);

		//kill transactions after N seconds
		this._killTimeout = 20000;
		
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


		if(handshake.hooks instanceof Array) {
			handshake.hooks.forEach(this.getMethod('_hook'));
		} else {
			for(var route in handshake.hooks) {
				self._hook(route, handshake.hooks[route]);		
			}
		}
		
		
		//notify the rest of the app that the given apps are ready
		handshake.apps.forEach(function(app)
		{                                     
			self._router.push(app + '/ready', {}, { from: self._from(app) });
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
			transaction.emit('response', vine.error('Route does not exist').result({ connection: false }).end());
		});
	},
	
	/**
	 */
	
	'_onRequest': function(data, headers, from)
	{                  
		var ops = {
			from: this._from(from.name)
		},
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
	
	'_from': function(queue)
	{                                 
		var transactions = this._transactions, self = this;
		                    
		return {
			name: queue,
			pull: function(channel, data, ops, callback)
			{        
				if(typeof data == 'function')
				{
					callback = data;
					data = null;
					ops = null;
				}            
				
				if(typeof ops == 'function')
				{
					callback = ops;
					ops = null;
				}              
				
				if(!ops) ops = {};
				if(!data) data = {};           
				                                              
				transactions.create(channel).prepare('pull', {
					meta: ops.meta || {},
					data: data,
					queue: queue
				}).register({ timeout: self._killTimeout }).send().onEnd('response', callback);
			},
			push: function(channel, data, ops)
			{   
				if(!data) data = {};
				if(!ops) ops = {};                   
				
				transactions.create(channel).prepare('push', {
					meta: ops.meta || { },
					data: data,
					queue: queue
				}).send();
			}
		}
	},
	
	/**
	 */
	
	'_onResponse': function(data, headers, from)
	{
		var trans = this._transactions.live(headers.transactionId);
		
		if(!trans) return console.error('Transaction %s does not exist', headers.transactionId);
		
		trans.emit(headers.type, data);      
	},

	/**
	 */

	'_getQueue': function(channel) {

		if(!this.scope.length) return null;

		var queues = this._hooked[channel] || [];

		return _.intersection(queues, this.scope).pop();
	},
	
	/**
	 * hooks a *remote* route to the app
	 */
	
	'_hook': function(channel, queues)
	{

		//no "ready" hooks. This is FUGLY. 
		if(channel.match(/^[^\/]+\/ready$/) || this._hooked[channel]) {
			this._hooked[channel] = _.uniq(this._hooked[channel], queues);
			return;
		} 
		
		this._hooked[channel] = queues || [];
		
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

		self = this,

		scope = this._getQueue(channel);


		
		try
		{

			//this is a bug since hooked & unfilterable get filtered out
			if(r.has('pull ' + channel)) throw new Error('Hook exists');


			r.on('pull -hooked=true -unfilterable=true ' + channel, function(request)
			{                                        
				if(ignore[request.currentChannel]) return;
				
				Structr.copy(stickyData, request.data, true);      
				
				// console.log(channel);
				// console.log(self._hooked[channel]);
				// console.log(self.scope)

				request.queue = request.queue || self._getQueue(channel);

				// console.log(request.currentChannel);
				// console.log(request.queue);
				
				transactions.create(request.currentChannel).prepare('pull', request).register({ timeout: self._killTImeout }).send().onEnd('response', function(response)
				{
					request.end(response);
				});
			});
			
			r.on('push -hooked=true -unfilterable=true ' + channel, function(data)
			{                              
				if(ignore[this.currentChannel]) return;
				Structr.copy(stickyData, this.data, true);   
				                                     
				this.queue = this.queue || self._getQueue(channel);

				
				transactions.create(this.currentChannel).prepare('push', this).send();
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
	
	'__construct': function(router, scope)
	{
		this._router = router;
		this._transports = [];
		this._stickyData = {}
		this.scope = scope;
	},
	
	/**
	 */
	
	'addStickyData': function(data)
	{
		Structr.copy(data || {}, this._stickyData, true);
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