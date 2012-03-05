//#include ./plugins

var winston = require('mesh-winston');


exports.plugin = function(router, params)
{
	this.params({
		'hooks.core': params
	});

	this.require(__dirname + '/plugins');
}