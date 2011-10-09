require('./index');

var router = require('beanpole').router();


router.on({
	
	/**
	 */
	
	'push -public hook2/ready': function()
	{
		console.log('hook 2 ready!');
	},
	
	/**
	 */
	
	'push -public through/hook2 -> hello/:name': function(data)
	{
		console.log('hello %s', data.name);
	},
	
	/**
	 */
	
	'pull -public through/hook2 -> hello/:name/chat': function(request)
	{
		return "hello "+ request.data.name + '!';
	},
	
	/**
	 */
	
	'push -public through/hook2/again -> through/hook1': function(data)
	{
		console.log('through hook 1');
		
		setTimeout(function(self)
		{
			self.next();
		}, 500, this)
	}
});



router.params({
	'hooks.core': {
		name: 'hook1',
		target: {
			rabbitmq: {
				host: 'localhost'
			}
		}
	}
}).
require('hooks.core','hooks.rabbitmq');

router.push('init');
