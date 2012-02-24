var _ = require('underscore');


exports.generalizeParams = function(channel) {

	var params = channel.match(/\:\w+/g);

	if(params) {
		for(var i = 0, n = params.length; i < n; i++) {

			channel = channel.replace('/'+params[i], '/:__param' + i);

		}
	}


	return channel;
}


exports.siftChannels = function(router) {

	return _.map(router.channels({ siftTags: exports.tagSearch }), function(channel) {
		return { channel: channel.path || channel.value, type: channel.type };
	})

}


exports.tagSearch = {
	$and: [ 
		{ hook: { $exists: true } } ,
		{ hooked: { $exists: false } }
	] 
};