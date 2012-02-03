var Structr = require('structr'),
qs = require('querystring'),
logger = require('winston').loggers.get('daisy');

exports.name = 'jsonp';

var Transport = Structr({
	
	/**
	 */
	
	'__construct': function(params) {
		this.host = params.host;
		this.protocol = params.protocol || 'http:';
		this.rpc = params.rpc;

		
		this.connect();
	},
	
	/**
	 */
	
	'connect': function() {
		var self = this;
		
		$.ajax({
			url: this.protocol + '//' + this.host + '/hooks.json',
			dataType: 'jsonp',
			success: function(response) {
				self.onHandshake({
					apps: [self.host],
					hooks: response.result
				});

				self.onConnected();
			}
		});
		
		
	},
	
	/**
	 */
	
	'broadcast': function(channel, message, headers)  {
		var self = this;
		
		//don't return basic auth
		message.basicAuth = false;
		
		//not everything supports DELETE UPDATE
		message.httpMethod = headers.meta.method || 'GET';

		var url = this.protocol + '//' + this.host + '/' + channel + '.json';

		function onResponse(response) {

			headers.type = !headers.hasNext || response.errors ? 'response' : 'next';
					
			self.onMessage(response, headers, self.host);
		}


		//easyXDM?
		if(this.rpc) {

			this.rpc.request({
				url: url,
				data: { ran: Math.random(), json: JSON.stringify(message) },
				method: "GET",
				type: 'json'
			}, onResponse);

		} else {

			$.ajax({
				url: url + '?json='+ encodeURIComponent(JSON.stringify(message)),
				dataType: 'jsonp',
				success: onResponse
			});	

		}
		
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


exports.connect = function(params) {

	return new Transport(params);
	
}