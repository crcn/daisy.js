exports.toBeanpoleRoute = function(key)
{
	return key.replace(/\./g,'\/').replace(/\*/g,':param');
}

exports.toAMQPKey = function(channel)
{
	return channel.replace(/\:[^\/]+/g,'*').replace(/\//g,'.');
}