exports.plugin = function(router)
{
	router.on({
		'push init': function()
		{
			router.push('hooks/transport', require('./transport'));
		}
	})
}