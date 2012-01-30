var utils = require('./utils'),
Transports = require('./transports'),
vine = require('vine');

	
exports.plugin = function(router, params) {

	if(!params.remoteName) throw new Error('A name must be provided for your app');
	
	//target hooks
	var target = params.target || params.transport || {},
	transports = new Transports(router, params.scope, params.remoteName),
	transportTypes = {};

	
	var haba = this;


	var self = {

		/**
		 */

		init: function() {
			
			haba.plugins('hooks.transport.*').forEach(function(plugin) {

				self.addHookTransport(plugin.transport);

			});
		},

		/**
		 */

		addChannels: function(channels) {
			
			var pubChannels = utils.publicChannels(channels);
			
			if(!pubChannels.length) return;
			
			transports.publishHooks(pubChannels);
				
		},

		/**
		 */

		addHookData: function(stickyData) {

			transports.addStickyData(data);

		},

		/**
		 */

		connectHook: function(config) {
			
			transports.add(transportTypes[config.type].connect(config));

		},

		/**
		 */

		addHookTransport: function(transport) {


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
					cfg.name = params.remoteName;
					
					transports.add(transport.connect(cfg));
				})
			}

		}
	};

	router.on({
		
		/**
		 */
		
		'pull -hook hooks': function() {

			//TODO - get perm level of given session
			return vine.result(utils.siftChannels(router)).end();
		},
		
		/**
		 * data that's passed to hooks on every request, such as access tokens
		 */
		
		'push hooks/sticky/data OR hooks/data': self.addHookData,
		
		/**
		 */
		
		'push -private channels': self.addChannels,
		
		/**
		 */
		
		'push -private hooks/connect/:type': self.connectHook,


		/**
		 * end any piped data - it isn't supported yet
		 */

		/*'push OR pull OR collect -hooked /**': function(req, res, mw) {

			this.message.writer.end();

			this.next();
		}*/
	});

	return self;
}