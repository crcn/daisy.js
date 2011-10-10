
if(typeof require != 'undefined') require.paths.unshift(__dirname + '/beans');


exports.plugin = function(router, params)
{
	router.params({
		'hooks.core': params
	});
	
	router.require(__dirname + '/beans');
}