//#include ./plugins

var winston = require('mesh-winston');


exports.plugin = function(router, params)
{
	this.params({
		'hooks.core': params
	});

	/*winston.loggers.add('daisy', {
	
		console: {
			colorize: false
		}

	});*/

	

	this.require(__dirname + '/plugins');
}