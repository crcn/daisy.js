var beanpoll = require("beanpoll"),
haba = require("haba"),
router = beanpoll.router();





router.on({
	
	/**
	 */
	
	'pull -hook register/app': function(req, res)
	{
		console.log('Registering "%s"', this.from.name);
		res.end('Registered app')
	}
	
});


haba.loader().
options(router, true).
params({
	index: {
		remoteName: 'http-proxy',
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