var amqp = require('amqp'),
config = require('yaconfig').file('/etc/daisy/server3.json');

require('colors')


exports.connect = function(ops) {
	console.log('Connecting to %s', ops.host);
	
	var connection = amqp.createConnection(ops),

	//reconnect on disconnect
	reconnect = function() {
		setTimeout(exports.connect, 5000, ops);
	}
	
	connection.on('error', function(){ });
	connection.on('close', reconnect)

	connection.on('ready', function() {
	    connection.exchange('handshake', { type: 'topic' }, function(handshakeExchange) {
			connection.exchange('messages', { topic: 'topic' }, function(messageExchange) {
				var queue = connection.queue('daisy', function() {
					
					//bind new, registered applications
					queue.bind(handshakeExchange, 'register');

					var allHooks = config.get('hooks') || {

						//the registered applications
						apps: [],

						//all the hooks mashed up into one
						hooks: {}
					};

					queue.subscribe(function(hooks, headers, ops) {
						var appName = ops.replyTo.split('.').shift(),
						newHook = {
							apps: [appName],

							hooks: {}
						} 

						if(allHooks.apps.indexOf(appName) == -1) allHooks.apps.push(appName);
						
						

						hooks.forEach(function(hook) {
							if(!allHooks.hooks[hook]) allHooks.hooks[hook] = [];
							if(allHooks.hooks[hook].indexOf(appName) > -1) return;

							allHooks.hooks[hook].push(appName);
							newHook.hooks[hook] = [appName];
							
							//└──
							console.log("├── %s:%s", appName, hook);
						});


						console.log(allHooks)
						      

						//notify all consumers that a new hook has been added
						handshakeExchange.publish('new.hooks', newHook, { contentType: 'application/json' });

						//but also return *all* the hooks to the new consumer
						connection.publish(ops.replyTo, allHooks, { contentType: 'application/json' });   
						                      
						config.set('hooks', allHooks);  
						config.save();
					});
				});
			});
	    });
	});
}
    
