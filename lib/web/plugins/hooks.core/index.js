var utils = require('./utils'),
Transports = require('./transports'),
vine = require('vine'),
logger = require('winston').loggers.get('daisy'),
sprintf = require('sprintf').sprintf;

	
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

		addListener: function(listener) {
			
			if(!listener.route.tags.hook) return;


			transports.publishHooks([{
				channel: listener.route.channel.value,
				type: listener.route.type
			}]);
				
		},

		/**
		 */

		addHookData: function(stickyData) {

			logger.verbose('adding sticky data to daisy');
			
			transports.addStickyData(stickyData);

		},

		/**
		 */

		connectHook: function(config) {

			logger.verbose(sprintf('connecting hook %s', config.type));

			
			transports.add(transportTypes[config.type].connect(config));

		},

		/**
		 */

		addHookTransport: function(transport) {

			logger.verbose(sprintf('adding available hook transport %s', transport.name));

			transportTypes[transport.name] = transport;
		}
	};

	router.on({

		/**
		 * connect before starting up this app
		 */

		'pull load/*': function(req, res, mw) {
			logger.verbose('loading daisy');

			console.log(target)

			for(var name in target) {
				
				var transport = transportTypes[name];


				if(!transport) continue;

				//can be multiple hooks to a particular transport.
				var transportConfigs = target[transport.name];
				
				if(!(transportConfigs instanceof Array)) transportConfigs = [transportConfigs];
				
				var running = transportConfigs.length;
				
				transportConfigs.forEach(function(cfg)
				{
					//set the queue name
					cfg.name = params.remoteName;
					
					transports.add(transport.connect(cfg)).once('connect', function() {
						if(!(--running)) mw.next();
					})
				})
			}
		},


		/**
		 */

		'push -private new/listener': self.addListener,

		/**
		 */
		
		'pull -hook -method=GET hooks': function(req, res) {

			//TODO - get perm level of given session
			return vine.result(utils.siftChannels(router)).end(res);
		},
		
		/**
		 * data that's passed to hooks on every request, such as access tokens
		 */
		
		'push hooks/sticky/data OR hooks/data': self.addHookData,
		
		/**
		 */
		
		'push -private hooks/connect': self.connectHook


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