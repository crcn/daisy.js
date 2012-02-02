var winston = require('winston');






exports.plugin = function(router, params)
{
	this.params({
		'hooks.core': params
	});

	winston.loggers.add('daisy', {
	
		console: {
			colorize: false
		}

	});

	

	this.require(__dirname + '/beans');
}