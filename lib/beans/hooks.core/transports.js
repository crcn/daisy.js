var Structr = require('structr'),
utils = require('./utils'),
Transactions = require('./transactions');



var TransportWrapper = Structr({
	
	/**
	 */
	
	'__construct': function(collection, transport)
	{
		this._collection = collection;
		this._router = collection._router;
		this._transport = transport;
		this._hooked = {};
		this._transactions = new Transactions(transport);
		
		
		transport.onHandshake = this.getMethod('onHandshake');
		transport.onMessage = this.getMethod('onMessage');
	},
	
	/**
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
	 */
	
	'onMessage': function(data, headers, from)
	{
		var ops = {},
		self = this,
		respond = function(response, type)
		{
			self._transport.direct(from.name, response, { transactionId: headers.transactionId, type: type } );
			
			// queue.shift();
		};
		
		if(headers.hasNext)
		{
			ops._next = function()
			{
				respond(null, 'next');
			}
		}
		
		//PRODUCER
		
		if(headers.type == 'push')
		{
			self._router.push(headers.channel, data, ops);
		}
		else
		if(headers.type == 'pull')
		{
			self._router.pull(headers.channel, data, ops, function(response)
			{
				respond(response, 'response');
			});
		}
		
		
		//CONSUMER
		else
		{
			var trans = self._transactions.live(headers.transactionId);
			
			if(!trans) return console.error('Transaction %s does not exist', headers.transactionId);
			
			trans.emit(headers.type, data);
		}
	},
	
	/**
	 */
	
	'_hook': function(channel)
	{
		//no "ready" hooks. This is FUGLY. 
		if(channel.match(/^[^\/]+\/ready$/) || this._hooked[channel]) return;
		
		
		this._hooked[channel] = 1;
		
		var r = this._router,
		transport = this._transport,
		transactions = this._transactions;
		
		try
		{
			r.on('pull -hooked ' + channel, function(request)
			{
				transactions.create(request.currentChannel).register().send('pull', request).on('response', function(response)
				{
					request.end(response);
				});
			});
			
			r.on('push -hooked ' + channel, function(data)
			{
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
	
	'add': function(transport)
	{
		var wrapper = new TransportWrapper(this, transport);
		
		this._transports.push(wrapper);
		
		
		wrapper.publishHooks(utils.publicChannels(this._router.channels()));
	}
});