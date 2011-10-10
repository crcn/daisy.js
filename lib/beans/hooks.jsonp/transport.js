var Structr = require('structr'),
qs = require('querystring');

exports.name = 'jsonp';

var Transport = Structr({
	
	/**
	 */
	
	'__construct': function(params)
	{
		this.host = params.host;
		
		this.connect();
	},
	
	/**
	 */
	
	'connect': function()
	{
		var self = this;
		
		$.ajax({
			url: 'http://' + this.host + '/hooks',
			dataType: 'jsonp',
			success: function(response)
			{
				self.onHandshake({
					apps: [self.host],
					hooks: response.result
				})
			}
		});
		
		
	},
	
	/**
	 */
	
	'broadcast': function(channel, message, headers) 
	{
		var self = this;
		
		//don't return basic auth
		message.basicAuth = false;
		
		//not everything supports DELETE UPDATE
		message.httpMethod = headers.meta.method || 'GET';
		
		$.ajax({
			url: 'http://' + this.host + '/' + channel + '?json=' + JSON.stringify(message),
			dataType: 'jsonp',
			success: function(response)
			{
				headers.type = !headers.hasNext || response.errors ? 'response' : 'next';
				
				self.onMessage(response, headers, self.host);
			}
		});
	},
	
	/**
	 * stuff we can't use for jsonp
	 */
	
	'publishHooks': function(hooks) { },
	'direct': function(queue, message, headers) { },
	
	/** 
	 * Returned hooks, and any siblings on the network
	 */

	'onHandshake': function(handshake) { },

	/**
	 * when a call is coming in
	 */

	'onMessage': function(message, headers, from) { }

});


exports.connect = function(params)
{
	return new Transport(params);
}