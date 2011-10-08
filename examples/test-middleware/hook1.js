var beanpole = require('beanpole'),
router = beanpole.router();



router.on({
	
	/**
	 */
	
	'push hook2/ready': function()
	{
		console.log('hook 2 ready!');
		
	},
	
	/**
	 */
	
	'push -public through/hook1 -> hello': function(name)
	{
		console.log('hello %s!', name);
	},
	
	/**
	 */
	
	'push -public through/hook2': function()
	{
		console.log('through hook1');
		
		this.next();
	}
	
});



require('../../lib/plugin').plugin(router, {
	name: 'hook1'
})