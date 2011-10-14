var amqp = require('amqp'),
Structr = require('structr'),
Bucket = require('./bucket'),
utils = require('./utils'),
_ = require('underscore')

exports.name = 'rabbitmq';

var Transport = Structr({

	/**
	 */
	
	'__construct': function(params)
	{
		this.host = params.host;
		this.name = params.name;
		this.connect();
		
		this._hooksBucket = new Bucket();
		this._appHooks = [];
	},
	
	/**
	 * handshake with rabbitmq
	 */
	
	'connect': function()
	{
		var connection = this.connection = amqp.createConnection({ host: this.host }),
		self = this;
		
		connection.on('ready', function ()
		{
			self._connectionReady();
		});
	},
	
	/**
	 * these hooks are published to the world
	 */
	
	'publishHooks': function(hooks)
	{
		this._hooksBucket.add(hooks);
		
		if(this._ready)
		{
			//TODO
			// self._handshakeExchange.publish('add.hooks', hooks, self._mops({ replyTo:  self._handshakeQueue.name }));
		}
	},
	
	/** 
	 * Returned hooks, and any siblings on the network
	 */
	
	'onHandshake': function(handshake) { },
	
	/**
	 * when a call is coming in
	 */
	
	'onMessage': function(message, headers, from) { },
	
	/**
	 */
	
	'broadcast': function(channel, message, headers)
	{	                      
		this._messageExchange.publish(utils.toAMQPKey(channel), { data: message }, this._mops({ headers: headers, replyTo: this.name }));
	},
	
	/**
	 */
	
	'direct': function(queue, message, headers)
	{                           
		this.connection.publish(queue, { data: message }, this._mops({ headers: headers, replyTo: this.name }));
	},
	
	/**
	 */
	
	'_connectionReady': function()
	{
		this._prepHooksExchange();
	},
	
	/**
	 */
	
	'_prepHooksExchange': function()
	{
		var self = this;
		
		this._handshakeExchange = this.connection.exchange('handshake', { type: 'topic' }, function(exchange)
		{
			queue = self._handshakeQueue = self.connection.queue(self.name + '.handshake', function()
			{
				queue.subscribe(self.getMethod('_onHandshake'));
				
				self._prepMessagesExchange();
			});
		});
	},
	
	
	/**
	 */
	
	'_prepMessagesExchange': function()
	{
		var self = this;

		this._messageExchange = this.connection.exchange('messages', { type: 'topic' }, function(exchange)
		{
			var queue = self._messageQueue = self.connection.queue(self.name, { 'durable': true }, function()
			{
				//listen for incomming messages. They must be acknowledged
				queue.subscribe(function(message, headers, props)
				{
					var from = {
						name: props.replyTo
					};        
					                        

					self.onMessage(message.data, headers, from);
					
				});
				
				var hooks = [];
				
				self._hooksBucket.dump(function(hook)
				{
					var key = utils.toAMQPKey(hook);
					hooks.push(key);
					
					queue.bind(exchange, key);
				});

				
				//register the application, and return the hooks we can tap into
				self._handshakeExchange.publish('register', hooks, self._mops({ replyTo:  self._handshakeQueue.name }));


			})
		});     
		
		function onReturn(ret)
		{                                              
			if(ret.replyText == 'NO_ROUTE' && self.onNoRoute)
			{                                         
				self.onNoRoute(utils.toBeanpoleRoute(ret.routingKey));
				/*(self._transactions.live(ret.routingKey) || []).forEach(function(transaction)
				{
					transaction.response(vine.error('Channel "%s" does not exist', ret.routingKey).result({ connection: false }).end());
				});*/
			}
		}

		//handle any routes which aren't registered
		this._messageExchange.on('basicReturn', onReturn);         
		this.connection.exchange().on('basicReturn', onReturn)
	},
	
	/**
	 */
	
	'_onHandshake': function(handshake)
	{
		handshake.hooks = _.map(handshake.hooks, function(hook){ return utils.toBeanpoleRoute(hook); });
		
		this.onHandshake(handshake);
		
		
		//after the first handshake, listen for any new hooks taht come in
		if(!this._connected)
		{
			this._connected = true;
			
			//after we get the hooks, listen for any new comming in
			this._handshakeQueue.bind(this._handshakeExchange, 'new.hooks');
		}
	},
	
	/**
	 */
	
	'_mops': function(ops)
	{
		if(!ops) ops = {};
		
		ops.contentType = 'application/json';
		ops.mandatory = true;
		
		return ops;
	}
});

exports.connect = function(params)
{
	return new Transport(params);
}