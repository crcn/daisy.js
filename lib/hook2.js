require('./index');

var router = require('beanpole').router();


router.on({
	
	/**
	 */
	
	'push -public hook1/ready': function()
	{
		console.log('hook 1 ready!');
		
		router.push('hello/craig');
	},
	
	/**
	 */
	
	'push -public through/hook2': function()
	{
		console.log("THROUGH HOOK2");
		
		setTimeout(function(self)
		{
			self.next();
		}, 500, this)
	}
});



router.params({
	'hooks.core': {
		name: 'hook2',
		target: {
			rabbitmq: {
				host: 'localhost'
			}
		}
	}
}).
require('hooks.core','hooks.rabbitmq');

router.push('init');
