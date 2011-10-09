var amqp = require('amqp'),
Structr = require('structr'),
cashew = require('cashew'),
vine = require('vine');


function amqpRoutingKeys(channels)
{
	var pub = [];
	
	for(var name in channels)
	{
		var channel = channels[name];
		
		if(!channel.meta.public || channel.meta.hooked) continue;
		
		var toamq = [];
		
		//fucking yuck.
		for(var i = 0, n = channel.channel.paths.length; i < n; i++)
		{
			var path = channel.channel.paths[i];
			
			toamq.push(path.param ? '*' : path.name); 
		}
		
		pub.push(toamq.join('.'));
	}
	
	return pub;
}


function toBeanpoleRoute(key)
{
	return key.replace(/\./g,'\/').replace(/\*/g,':param');
}



exports.plugin = function(router, params)
{
	if(!params.host) params.host = 'localhost';
	if(!params.name) throw new Error('Name must be present for amqp');
	if(!params.group) params.group = 'beanpole';
	
	
	
	
	router.on({
		
		/**
		 */
		
		'push init': function()
		{
			var broker = new Broker(router);
			broker.prepare = function()
			{
				broker.addHooks(amqpRoutingKeys(router.channels()));
			}
			broker.connect(params);
		},
		
		/**
		 */
		
		'push channels': function(channels)
		{
			// broadcastChannels(channels);
		}
	})
}


var Broker = Structr({
	
	/**
	 */
	
	
	'__construct': function(router)
	{
		this._router = router;
		this._hooks = new Hooks();
		this._transactions = new Transactions(this);
		
		//incomming requests. dirty check
		this._incomming = {};
	},
	
	
	/**
	 */
	
	'connect': function(params)
	{
		this.params = params;
		
		var connection = this.connection = amqp.createConnection({ host: params.host }),
		self = this;
		
		connection.on('ready', function ()
		{
			self._connectionReady();
		});
	},
	
	/**
	 */
	
	'addHooks': function(hooks)
	{
		this._hooks.add(hooks);
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
			queue = self._handshakeQueue = self.connection.queue(self.params.name + '.handshake', function()
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
			var queue = self._messageQueue = self.connection.queue(self.params.name, { 'durable': true }, function()
			{
				//listen for incomming messages. They must be acknowledged
				queue.subscribe(function(message, headers, props)
				{
					self._incomming[props.routingKey] = 1;
					
					var ops = {
						from: {
							name: props.replyTo
						}
					},
					respond = function(response, type)
					{
						self.connection.publish(props.replyTo, { data: response }, self._mops({ headers: { transactionId: headers.transactionId, type: type }}));
						
						// queue.shift();
					};
					
					
					//middleware?
					if(headers.hasNext)
					{
						ops._next = function()
						{
							respond({ }, 'next');
						};
						
						ops.meta = {};
					}
					
					//CONSUMER
					
					//data pushed from a server. Used for dispatching changes
					if(headers.type == 'push')
					{
						
						self._router.push(toBeanpoleRoute(props.routingKey), message.data, ops);
						
						// if(!ops._next) queue.shift();
					}
					
					//server making a particular request
					else
					if(headers.type == 'pull')
					{
						self._router.pull(toBeanpoleRoute(props.routingKey), message.data, ops, function(response)
						{
							respond(response, 'response');
						});
					}
					
					
					//PRODUCER
					
					//response to a particular request
					else
					if(headers.type == 'response')
					{
						var transaction = self._transactions.live(headers.transactionId);
						
						if(!transaction)
						{
							return console.error('transaction %s does not exist', headers.transactionId);
						}
						
						transaction.response(message.data, headers);
						
						// queue.shift();
					}
					
					//calling 
					else
					if(headers.type == 'next')
					{
						self._transactions.live(headers.transactionId).next();
						
						// queue.shift();
					}
					
					delete self._incomming[props.routingKey];
				});
				
				self.prepare();
				self._hooks.appKeys().forEach(function(key)
				{
					queue.bind(exchange, key)
				});
				
				
				//register the application, and return the hooks we can tap into
				self._handshakeExchange.publish('register', self._hooks, self._mops({ replyTo:  self._handshakeQueue.name }));
				
				
			})
		});
		
		//handle any routes which aren't registered
		this._messageExchange.on('basicReturn', function(ret)
		{
			if(ret.replyText == 'NO_ROUTE')
			{
				(self._transactions.live(ret.routingKey) || []).forEach(function(transaction)
				{
					transaction.response(vine.error('Channel "%s" does not exist', ret.routingKey).result({ connection: false }).end());
				});
				
			}
		})
	},
	

	/**
	 */
	
	'_onHandshake': function(handshake, headers, props)
	{
		var self = this;
		
		
		
		//after the handshake, we can listen for new hooks. First time - the response back is everything.
		if(!this._ready)
		{
			this._ready = true;
			
			//after we get the hooks, listen for any new comming in
			this._handshakeQueue.bind(this._handshakeExchange, 'new.hooks');
		}
		
		//add the hooks. Returned will be the hooks which were *actually* registered
		var usable = this._hooks.add(handshake.hooks, true);
		
		
		//hook in the routes locally 
		usable.forEach(function(key)
		{
			var channel = toBeanpoleRoute(key);
			
			//fucking yuck. This is to prevent any "ready" routes from being re-dispatched. "Ready" routes are called below
			if(key.match(/^[^\.]+\.ready$/g)) return;
			
			
			try
			{
				self._router.on('push ' + channel, function(data)
				{
					
					if(self._incomming[key]) return;
					
					var trans = self._transactions.create(key),
					request = this;
					
					if(request.hasNext())
					{
						trans.register();
						trans.onNext = function(response)
						{
							request.next();
						}
					}
					
					trans.send(data, { type: 'push', hasNext: request.hasNext() });
				});
				
				
				self._router.on('pull ' + channel, function(request)
				{	
					if(self._incomming[key]) return;
					
					var trans = self._transactions.create(key).register(),
					request = this;
					
					trans.onNext = function()
					{
						request.next();
					}

					trans.onResponse = function(response)
					{
						request.end(response);
					}
					

					trans.send(request.data, { type: 'pull', hasNext: request.hasNext() });
				});
			}
			
			//already exists locally?
			catch(e)
			{
				console.warn('cannot bind channel: %s', channel);
				//already exists.
			}
		});
		
		//notify the beanpole app that the hooked app is ready (queue name usually). Can start calling
		//remote shit.
		handshake.apps.forEach(function(appName)
		{
			self._router.push(appName + '/ready');
		});
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


var Transaction = Structr({
	
	/**
	 */
	
	'__construct': function(routingKey, collection, id)
	{
		this._routingKey = routingKey;
		this._collection = collection;
		this._id = id;
		this._exchange = collection._broker._messageExchange;
		this._queue = collection._broker._messageQueue;
	},
	
	
	/**
	 * registers this as a transaction that should be kept live ~ expecting a response.
	 */
	
	'register': function()
	{
		this._collection._register(this);
		return this;
	},
	
	/**
	 * sends a message off to rabbitmq
	 */
	
	'send': function(body, ops)
	{
		if(!ops) ops = {};
		
		ops.transactionId = this._id;
		
		this._exchange.publish(this._routingKey, { data: body }, { headers: ops, contentType: 'application/json', replyTo: this._queue.name, mandatory: true  });
	},
	
	/**
	 */
	
	'response': function(body, headers)
	{
		if(this.onResponse) this.onResponse(body, headers);
		
		//we're done - delete the transaction
		this._collection._unregister(this);
	},
	
	/**
	 * moves onto the next channel e.g: "authorize -> login"
	 */
	
	'next': function() 
	{ 
		if(this.onNext) this.onNext();
		
		this._collection._unregister(this);
	}
	
});



//RPC between two servers basically
var Transactions = Structr({
	
	/**
	 */
	
	'__construct': function(broker)
	{
		this._idGen = cashew.register('idgen');
		this._live = {};
		this._liveByKey = {};
		this._broker = broker;
	},
	
	/**
	 */
	
	'create': function(routingKey)
	{
		return new Transaction(routingKey, this, this._idGen.uid());
	},
	
	/**
	 */
	
	'_register': function(transaction)
	{
		this._live[transaction._id] = transaction;
		
		if(!this._liveByKey[transaction._routingKey]) this._liveByKey[transaction._routingKey] = [];
		
		this._liveByKey[transaction._routingKey].push(transaction);
	},
	
	/**
	 */
	
	'_unregister': function(transaction)
	{
		delete this._live[transaction._id];
		
		var stack = this._liveByKey[transaction._routingKey];
		stack.splice(stack.indexOf(transaction), 1);
		
		if(!stack.length) delete this._liveByKey[transaction._routingKey];
	},
	
	/**
	 */
	
	'live': function(transactioId)
	{
		return this._live[transactioId] || this._liveByKey[transactioId];
	}
})


var Hooks = Structr({
	
	/**
	 */
	
	'__construct': function()
	{
		this._hooks = [];
		this._used = {};
	},
	
	/**
	 */
	
	'add': function(hooks, hooked)
	{
		if(!(hooks instanceof Array)) hooks = [hooks];
		
		var self = this,
		usable = [];
		
		hooks.forEach(function(hook)
		{
			if(self._used[hook]) return;
			
			self._used[hook] = 1;
			
			usable.push(hook);
			
			self._hooks.push({
				key: hook,
				hooked: !!hooked
			})
		})
		
		return usable;
	},
	
	/**
	 */
	
	'appKeys': function()
	{
		var keys = [];
		
		this._hooks.forEach(function(hook)
		{
			if(hook.hooked) return;
			
			keys.push(hook.key);
		})
		
		
		return keys;
	},
	
	/**
	 */
	
	'toJSON': function()
	{
		var appHooks = [];
		
		this._hooks.forEach(function(hook)
		{
			if(hook.hooked) return;
			
			appHooks.push(hook.key);
		})
		
		return appHooks;
	}
});
