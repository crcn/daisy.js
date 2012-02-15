var amqp = require('amqp'),
config = require('yaconfig').file('/etc/daisy/server4.json');

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

			handshakeExchange.publish('connected',true);

			connection.exchange('messages', { topic: 'topic' }, function(messageExchange) {
				var queue = connection.queue('daisy', function() {
					
					//bind new, registered applications
					queue.bind(handshakeExchange, 'register');

					var allHooks = {

						//the registered applications
						apps: [],

						//all the hooks mashed up into one
						hooks: {}
					};

					queue.subscribe(function(hooks, headers, ops) {

						var appName = headers.appName,
						newHook = {
							apps: [appName],

							hooks: {}
						} 

						if(allHooks.apps.indexOf(appName) == -1) allHooks.apps.push(appName);
						
						

						hooks.forEach(function(hook) {

							var channel = hook.channel,
							type = hook.type;

							if(!allHooks.hooks[channel]) allHooks.hooks[channel] = { a: [], t: [] };

							var allInf = allHooks.hooks[channel],
							hasApp = allInf.a.indexOf(appName) > -1,
							hasType = allInf.t.indexOf(type) > -1,
							isNew = !hasApp || !hasType;



							if(isNew) {

								if(!hasApp) allInf.a.push(appName);
								if(!hasType) allInf.t.push(type);

								newHook.hooks[channel] = { a: [appName], t: [hook.type] }
								
								//└──
								console.log("├──%s %s:%s", type, appName, channel);
								
							}

						});

						      

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
    
