var beanpoll = require("beanpoll"),
haba = require("haba"),
router = beanpoll.router();





router.on({
	
	/**
	 */
	
	'push -hook hook2/ready': function()
	{
		console.log('hook 2 ready!');
	},

	/**
	 */

	'push -hook test2 -> test': function() {
		console.log("TEST");
	},

	/**
	 */

	'push timeout': function(msg, mw) {
		
		console.log("TIMEOUT")
		setTimeout(function() {
			mw.next();
		}, 1000);
	},

	/**
	 */

	'push -hook timeout -> test3': function() {
		console.log("TEST 3");
		var self = this;

		setTimeout(function() {
			self.next();
		}, 100);
	}
	
});


haba.loader().
options(router, true).
params({
	index: {
		remoteName: 'hook1',
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