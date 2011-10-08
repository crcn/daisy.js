var beanpole = require('beanpole'),
router = beanpole.router();



router.on({
	
	/**
	 */
	
	'push hook1/ready': function()
	{
		console.log('hook 1 ready!');
		
		router.pull('hello/craig', function(response)
		{
			console.log(response);
		});
	}
	
});



require('../../lib/plugin').plugin(router, {
	name: 'hook2'
})