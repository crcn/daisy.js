
exports.plugin = function(router, params)
{
	this.params({
		'hooks.core': params
	});
	

	this.require(__dirname + '/beans');
}