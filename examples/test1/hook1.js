var beanpole = require('beanpole'),
router = beanpole.router();



router.on({
	
	/**
	 */
	
	'push hook2/ready': function()
	{
		console.log('hook 2 ready!');
	}
	
});



require('../../lib/plugin').plugin(router, {
	name: 'hook1'
})

router.push('init');