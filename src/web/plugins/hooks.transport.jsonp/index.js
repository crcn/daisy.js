
exports.plugin = function(router) {
 
	return {
		transport: require('./transport')
	};
}