var amqp = require('amqp'),
Structr = require('structr'),
Bucket = require('./bucket'),
utils = require('./utils'),
_ = require('underscore'),
cashew = require('cashew');

exports.name = 'rabbitmq';

var Transport = Structr({

	/**
	 */
	
	'__construct': function(params) {

		this.host = params.host;
		this.name = params.name;
		this.idGen = cashew.register('rabbitmq');
		this.replyToName = this.name + '.replyTo.' + this.idGen.uid();

		this.connect();
		
		this._hooksBucket = new Bucket();
		this._appHooks = [];
	},
	
	/**
	 * handshake with rabbitmq
	 */
	
	'connect': function() {

		var connection = this.connection = amqp.createConnection({ host: this.host }),
		self = this;
		
		connection.on('ready', function () {

			self._connectionReady();
		});

		connection.on('error', function(error) {
			//console.error(error);
		});//fix thrown error

		connection.on('close', function() {

			console.log('Rabbit MQ has closed, restarting...');

			self.onDisconnected();

			setTimeout(function() {
				self.connect();
			}, 5000);
		})
	},
	
	/**
	 * these hooks are published to the world
	 */
	
	'publishHooks': function(hooks) {

		this._hooksBucket.add(hooks);
		
		if(this._ready) {
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
	 * called ONCE, or if rabbitmq goes down and reconnects
	 */

	'onConnected': function() { },

	/**
	 */

	'onDisconnected': function(){ },
	
	/**
	 */
	
	'broadcast': function(channel, message, headers) {	 
	                       
		headers.appName = this.name;


		this._messageExchange.publish(utils.toAMQPKey(channel), { data: message }, this._mops({ headers: headers, replyTo: this._replyToQueue.name }));
	},
	
	/**
	 */
	
	'direct': function(queue, message, headers) {  
	                         
		headers.appName = this.name;

		//for specified scope
		var queues = queue instanceof Array ? queue : [queue];

		for(var i = queues.length; i--;)
			this.connection.publish(queues[i], { data: message }, this._mops({ headers: headers, replyTo: this._replyToQueue.name  }));
	},
	
	/**
	 */
	
	'_connectionReady': function() {

		this._connected = false;
		this.__messageExchange = null;
		this._prepHooksExchange();
	},
	
	/**
	 */
	
	'_prepHooksExchange': function() {

		var self = this;
		
		this._handshakeExchange = this.connection.exchange('handshake', { type: 'topic' }, function(exchange) {

			queue = self._handshakeQueue = self.connection.queue(self.replyToName + '.handshake', function() {

				queue.subscribe(self.getMethod('_onHandshake'));
				
				self._prepMessagesExchange();
			});

			var reconnectQueue = self._reconnectQueue = self.connection.queue(self.replyToName + '.pingreconnect', function() {
				
				reconnectQueue.bind(self._handshakeExchange, 'connected');
				reconnectQueue.subscribe(self.getMethod('_onServerReconnect'));
			
			});
		});
	},

	
	
	/**
	 */
	
	'_prepMessagesExchange': function() {

		var self = this

		this._messageExchange = this.connection.exchange('messages', { type: 'topic' }, function(exchange) {

			//self._messageExchange = exchange;

			var onMessage = function(message, headers, props) {

				//happens when amqp fans out
				if(props.replyTo == self.replyToName) {
					return;
				}

				var from = {
					replyTo: props.replyTo,
					name: headers.appName
				};      


				self.onMessage(message.data, headers, from);
				
			}


			var queue = self._messageQueue = self.connection.queue(self.name, { 'durable': true }, function() {
				//listen for incomming messages. They must be acknowledged
				queue.subscribe(onMessage);
				
				self._onServerReconnect();
			});

			var replyToQueue = self._replyToQueue = self.connection.queue(self.replyToName, { 'durable': false }, function() {

				replyToQueue.subscribe(onMessage);

			});
		});     
		
		function onReturn(ret) {  
		                                            
			if(ret.replyText == 'NO_ROUTE' && self.onNoRoute) {    
			                                                     
				self.onNoRoute(utils.toBeanpoleRoute(ret.routingKey));

			}
		}

		//handle any routes which aren't registered
		this._messageExchange.on('basicReturn', onReturn);         
		this.connection.exchange().on('basicReturn', onReturn)
	},

	/**
	 */

	'_onServerReconnect': function(handshake, headers, props) {

		if(this._connected || !this._messageExchange) return;

		
		var hooks = [], self = this;
		
		this._hooksBucket.dump(function(hook) {
			var key = utils.toAMQPKey(hook);
			hooks.push(key);



			self._messageQueue.bind(self._messageExchange, key);
		});


		//register the application, and return the hooks we can tap into
		this._handshakeExchange.publish('register', hooks, this._mops({ replyTo:  this._handshakeQueue.name, headers: { appName: this.name } }));
	},
	
	/**
	 */
	
	'_onHandshake': function(handshake, headers, props) {
		var hooks = {};



		for(var route in handshake.hooks) {
			hooks[utils.toBeanpoleRoute(route)] = handshake.hooks[route];
		}

		handshake.hooks = hooks;
		
		this.onHandshake(handshake);
		
		
		//after the first handshake, listen for any new hooks taht come in
		if(!this._connected) {

			this._connected = true;
			
			//after we get the hooks, listen for any new comming in
			this._handshakeQueue.bind(this._handshakeExchange, 'new.hooks');

			this.onConnected();
		}
	},
	
	/**
	 */
	
	'_mops': function(ops) {

		if(!ops) ops = {};
		
		ops.contentType = 'application/json';
		ops.mandatory = true;
		
		return ops;
	}
});

exports.connect = function(params) {

	return new Transport(params);

}