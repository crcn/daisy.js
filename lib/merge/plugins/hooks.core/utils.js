var _ = require('underscore');


exports.generalizeParams = function(path) {

	var params = path.match(/\:\w+/g);

	if(params) {
		for(var i = 0, n = params.length; i < n; i++) {

			path = path.replace('/'+params[i], '/:__param' + i);

		}
	}


	return path;
}


exports.siftPaths = function(router) {

	return _.map(router.paths({ siftTags: exports.tagSearch }), function(path) {
		return { path: path.value, type: path.type };
	})

}


exports.tagSearch = {
	$and: [ 
		{ hook: { $exists: true } } ,
		{ hooked: { $exists: false } }
	] 
};