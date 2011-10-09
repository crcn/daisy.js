var Structr = require('structr'),
	http = require('http'),
	qs = require('querystring');
                            
/**
 * the transport between two proxies
 */


exports.request = function(ops, data, callback)
{
	if(typeof data == 'function')
	{
		callback = data;
		data = undefined;
	}

	if(!callback)
	{
		callback = function(){};
	}
	
	if(!ops.method) ops.method = 'GET';
	

	ops.connection = 'keep-alive';

	if(ops.data)
	{
		ops.path += '?' + qs.stringify(ops.data);
		delete ops.data;
	}
	
	ops.headers = { accept: '*/*' };

	ops.port = Number(ops.port)


	/**
		 
	var ops = {
		host:request.hostname,
		port:request.port,
		path:request.pathname+request.search,
		method:request.method,
		headers:request.headers,
		connection:'keep-alive'
	}
	*/


	var req = http.request(ops, function(res)
	{
		res.setEncoding('utf8');
		
		var buffer = '';

		res.on('data', function(data)
		{
			buffer += data;
		});
		
		res.on('end', function()
		{
			var result = buffer;;

			try
			{
				result = JSON.parse(buffer);
			}
			catch(e){ }

			if(callback) callback(false, result);
		});
	});
	
	req.on('error', callback);
	
	
	if(ops.method != 'GET' && data)
	{
		ops.headers['content-length'] = (data || '').length;
		ops.headers['content-type'] = 'application/json';
		req.write(data);
	}
	
	req.end();
}

exports.get = function(ops, callback)
{
	exports.request(ops, null, function(err, result)
	{
		try
		{
			if(callback) callback(err, result);
		}
		catch(e)
		{
			console.error('cannot callback for %s', ops.path);
			console.error(e.stack);
		}
	});
}


