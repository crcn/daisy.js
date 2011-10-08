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
	
	'pull -public hello/:name': function(request)
	{
		return 'hello ' + request.data.name;
	}
	
});



require('../../lib/plugin').plugin(router, {
	name: 'hook1'
})