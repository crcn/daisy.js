var amqp = require('amqp');

require('colors')


exports.connect = function(ops)
{
	console.log('Connecting to %s', ops.host);
	
	var connection = amqp.createConnection(ops);

	connection.on('ready', function()
	{
	    connection.exchange('handshake', { type: 'topic' }, function(handshakeExchange)
	    {
			connection.exchange('messages', { topic: 'topic' }, function(messageExchange)
			{
				var queue = connection.queue('daisy', function()
				{
					
					//bind new, registered applications
					queue.bind(handshakeExchange, 'register');

					var allHooks = {

						//the registered applications
						apps: [],

						//all the hooks mashed up into one
						hooks: []
					};

					queue.subscribe(function(hooks, headers, ops)
					{
						var appName = ops.replyTo.split('.').shift(),
						newHook = {
							apps: [appName],

							hooks: []
						}

						if(allHooks.apps.indexOf(appName) == -1) allHooks.apps.push(appName);
						
						

						hooks.forEach(function(hook)
						{
							if(allHooks.hooks.indexOf(hook) > -1) return;

							allHooks.hooks.push(hook);
							newHook.hooks.push(hook);
							
							//└──
							console.log("├── %s:%s", appName, hook);
						});
						
						
						

						//notify all consumers that a new hook has been added
						handshakeExchange.publish('new.hooks', newHook, { contentType: 'application/json' });

						//but also return *all* the hooks to the new consumer
						connection.publish(ops.replyTo, allHooks, { contentType: 'application/json' });
					});
				});
			})



	    });
	});
}
    