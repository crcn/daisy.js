var coreUtils = require('../hooks.core/utils');

exports.toBeanpoleRoute = function(key)
{   
	var channels = key.replace(/\*/g,':param').split(/\./g);
	
	var parts = []
	
	channels.forEach(function(channel)
	{                                                                          
		parts.push(decodeURIComponent(channel))
	})              
	                               
	                              
	
	return coreUtils.generalizeParams(parts.join('/'));
	                                                         
}

exports.toAMQPKey = function(channel)
{                          
	var channels = channel.replace(/(^\/)|(\/$)/g,'').replace(/\:[^\/]+/g,'*').split(/\//g);  
	    
	var parts = []
	
	channels.forEach(function(channel)
	{                                                              
		if(channel == '*') return parts.push(channel);
		            
		parts.push(encodeURIComponent(channel).replace(/\./g,'%2E'))
	})              
	                               
	                              
	
	return parts.join('.');
}                                                                                       