var coreUtils = require('../hooks.core/utils');

exports.toBeanpoleRoute = function(key)
{   
	var paths = key.replace(/\*/g,':param').split(/\./g);
	
	var parts = []
	
	paths.forEach(function(path)
	{                                                                          
		parts.push(decodeURIComponent(path))
	})              
	                               
	                              
	
	return coreUtils.generalizeParams(parts.join('/'));
	                                                         
}

exports.toAMQPKey = function(path)
{                          
	var segments = path.replace(/(^\/)|(\/$)/g,'').replace(/\:[^\/]+/g,'*').split(/\//g);  
	    
	var parts = []
	
	segments.forEach(function(segment)
	{                                                              
		if(segment == '*') return parts.push(segment);
		            
		parts.push(encodeURIComponent(segment).replace(/\./g,'%2E'))
	})              
	                               
	                              
	
	return parts.join('.');
}                                                                                       