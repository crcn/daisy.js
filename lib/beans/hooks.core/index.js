var utils = require('./utils'),
Transports = require('./transports')

	
exports.plugin = function(router, params)
{
	if(!params.name) throw new Error('A name must be provided for your app');
	
	//target hooks
	var target = params.target || {},
	transports = new Transports(router);
	
	
	router.on({
		
		/**
		 */
		
		'push hooks/transport': function(transport)
		{
			
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