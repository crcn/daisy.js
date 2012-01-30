var beanpoll = require("beanpoll"),
haba = require("haba"),
router = beanpoll.router();





router.on({
	
	/**
	 */
	
	'push -hook http-proxy/ready': function()
	{
		console.log('http proxy is ready!');
	}
	
});


haba.loader().
options(router, true).
params({
	index: {
		remoteName: 'app1',
		scope: ['app12','http-proxy'],
		transport: {
			rabbitmq: {
				host: 'localhost'
			}
		}	
	}
	
}).
require(__dirname + '/../../lib/index.js').
init();

router.push('init');