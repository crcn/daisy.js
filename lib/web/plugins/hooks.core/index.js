var utils = require('./utils'),
Transports = require('./transports'),
vine = require('vine'),
logger = require('mesh-winston').loggers.get('daisy'),
sprintf = require('sprintf').sprintf,
async   = require("async");

	
exports.plugin = function(router, loader) {

	var params = loader.params("daisy");


	//target hooks
	var target = params.target || params.transport || {},
	remoteName = params.name,
	transports = new Transports(router, params.scope, remoteName),
	transportTypes = {};


	if(!remoteName) throw new Error('A name must be provided for your app');


	var self = {

		/**
		 */

		addListener: function(listener) {
			
			if(!listener.route.tags.hook) return;


			transports.publishHooks([{
				path: listener.route.path.value,
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


	loader.modules("hooks.transport.*").forEach(function(module) {
		self.addHookTransport(module.transport);
	});

	router.on({

		/**
		 * connect before starting up this app
		 */

		'pull load/*': function(req, res, mw) {

			logger.verbose('loading daisy');

			async.forEach(Object.keys(target), function(transportName, next) {
				var transport = transportTypes[transportName];
				if(!transport) return next();

				//can be multiple hooks to a particular transport.
				var transportConfigs = target[transport.name];
				
				if(!(transportConfigs instanceof Array)) transportConfigs = [transportConfigs];
				
				var running = transportConfigs.length;

				async.forEach(transportConfigs, function(cfg, next) {
					//set the queue name
					cfg.name = remoteName;
					
					transports.add(transport.connect(cfg)).once('connect', next)
				}, next);

			}, function() {
				mw.next();
			})
		},


		/**
		 */

		'push -private new/listener': self.addListener,

		/**
		 */
		
		'pull -hook -ttl=3600 -method=GET hooks': function(req, res) {

			//TODO - get perm level of given session
			return vine.result(utils.siftPaths(router)).end(res);
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