require('./index');

var router = require('beanpole').router();


router.on({
	
	/**
	 */
	
	'push -public hook1/ready': function()
	{
		console.log('hook 1 ready!');
		
		// router.push('hello/craig');
		
		router.pull('hello/craig/chat', function(name)
		{
			console.log(name);
		})
	},
	/**
	 */
	
	'pull -public through/hook2': function()
	{
		return { name: 'craig' };
	},
	
	/**
	 */
	
	'push -public through/hook1 -> through/hook2': function()
	{
		console.log("THROUGH HOOK2");
		
		setTimeout(function(self)
		{
			self.next();
		}, 500, this)
	},
	
	/**
	 */
	
	'push -public through/hook2/again': function()
	{
		console.log('through hook 2 again!');
		
		setTimeout(function(self)
		{
			self.next();
		}, 500, this);
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
