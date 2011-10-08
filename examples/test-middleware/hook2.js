var beanpole = require('beanpole'),
router = beanpole.router();



router.on({
	
	/**
	 */
	
	'push hook1/ready': function()
	{
		console.log('hook 1 ready!');
		
		router.push('hello', 'craig');
	},
	
	/**
	 */
	
	'push -public through/hook2 -> through/hook1': function()
	{
		console.log('Through hook2, delaying...');
		
		setTimeout(function(self)
		{
			self.next();
		}, 500, this);
	}
	
});



require('../../lib/plugin').plugin(router, {
	name: 'hook2'
})