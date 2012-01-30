var _ = require('underscore');

exports.publicChannels = function(channels) {

	var pub = [];
	
	
	for(var name in channels) {

		var channel = channels[name];
		
		if(!channel.meta['public'] || channel.meta['hooked']) continue;
		
		pub.push(name)
	}
	
	return pub;
}


exports.siftChannels = function(router) {
	
	return _.pluck(router.channels({ siftTags: exports.tagSearch }), 'path');

}


exports.tagSearch = {
	$and: [ 
		{ hook: { $exists: true } } ,
		{ hooked: { $exists: false } }
	] 
};