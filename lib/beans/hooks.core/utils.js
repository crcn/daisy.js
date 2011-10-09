exports.publicChannels = function(channels)
{
	var pub = [];
	
	
	for(var name in channels)
	{
		var channel = channels[name];
		
		if(!channel.meta.public || channel.meta.hooked) continue;
		
		pub.push(name)
	}
	
	return pub;
}