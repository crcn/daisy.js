var utils = require('./utils'),
Transports = require('./transports'),
vine = require('vine');

	
exports.plugin = function(router, params)
{
	if(!params.name) throw new Error('A name must be provided for your app');
	
	//target hooks
	var target = params.target || params.transport || {},
	transports = new Transports(router, params.scope),
	transportTypes = {};

	
	router.on({
		
		/**
		 */
		
		'pull -public hooks': function()
		{
			return vine.result(utils.publicChannels(router.channels())).end();
		},
		
		/**
		 * data that's passed to hooks on every request, such as access tokens
		 */
		
		'push hooks/sticky/data OR hooks/data': function(data)
		{
			transports.addStickyData(data);
		},
		
		/**
		 */
		
		'push channels': function(channels)
		{
			var pubChannels = utils.publicChannels(channels);
			
			if(!pubChannels.length) return;
			
			transports.publishHooks(pubChannels);
		},
		
		/**
		 */
		
		'push hooks/connect/:type': function(cfg)
		{
			cfg.name = params.name;
			
			transports.add(transportTypes[cfg.type].connect(cfg));
		},
		
		/**
		 */
		
		'push hooks/transport': function(transport)
		{
			transportTypes[transport.name] = transport;
			
			//a target hook? use it, or lose it.
			if(target[transport.name])
			{
				
				//can be multiple hooks to a particular transport.
				var transportConfigs = target[transport.name];
				
				if(!(transportConfigs instanceof Array)) transportConfigs = [transportConfigs];
				
				
				transportConfigs.forEach(function(cfg)
				{
					//set the queue name
					cfg.name = params.name;
					
					transports.add(transport.connect(cfg));
				})
			}
		}
	});
}