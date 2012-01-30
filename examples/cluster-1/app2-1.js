var beanpoll = require("beanpoll"),
haba = require("haba"),
router = beanpoll.router();





router.on({
	
	/**
	 */
	
	'push -hook http-proxy/ready': function()
	{
		console.log('http proxy is ready!');
		router.request('register/app').error(function(err) {
			console.error(err.message)
		}).success(function(result) {
			console.log(result)
		}).pull();
	},

	/**
	 * this should NOT get triggered
	 */

	'push -hook app1/ready': function()
	{
		console.log("APP 1 ready (this shouldn't be triggered)")
	},

	/**
	 */

	'push -hook register/app': function()
	{
		console.log('register/app should NOT be triggered')
	}
	
});


haba.loader().
options(router, true).
params({
	index: {
		remoteName: 'app2',
		scope: ['app22','http-proxy'],
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