var __app = (function(){

	var mesh = {
		buildId: 'f512a782'
	};

	


if(!Object.keys) Object.keys = function(obj) {
	var keys = [];
	for(var key in obj) {
		keys.push(key);
	}
	return keys;
}


if(!Date.now) Date.now = function() {
	return new Date().getTime();
}


if(!Array.isArray) Array.isArray = function(target) {
	return target instanceof Array;
}

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind= function(owner) {
        var that= this;
        if (arguments.length<=1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args= Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
        if (i===undefined) i= this.length-1;
        if (i<0) i+= this.length;
        if (i>this.length-1) i= this.length-1;
        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(action, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter= function(filter, that /*opt*/) {
        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}

var _sardines = (function()
{
	var nodeRequire,
	allFiles = {};

	var moduleDoesntExist = function(path)
	{
		throw new Error('Module '+ path + ' does not exist');
	}


	if(typeof require == 'undefined')
	{
		nodeRequire = function(path)
		{
			moduleDoesntExist(path);
		}


		nodeRequire.resolve = moduleDoesntExist;
	}
	else
	{
		nodeRequire = require;
	}

	var register = function(path, moduleFactory)
	{

		path = normalizePath(path);
		addPathToTree(path);

		_sardines.moduleFactories[path] = moduleFactory,
		dir = dirname(path);

		return moduleFactory;
	}

	var addPathToTree = function(path) {

		var curTree = allFiles, prevTree = allFiles,
		parts = path.split('/'),
		part;

		for(var i = 0, n = parts.length; i < n; i++) {
			part = parts[i];
			if(!curTree[part]) curTree[part] = { };
			curTree = curTree[part];
		}
	}

	var dirname = function(path)
	{
		var pathParts = path.split('/');
		pathParts.pop();
		return pathParts.join('/');
	}



	var req = function(path, cwd)
	{
		var fullPath = req.resolve(path, cwd ? cwd : '/');

		if(_sardines.modules[fullPath]) return _sardines.modules[fullPath];

		var factory = _sardines.moduleFactories[fullPath];

		if(!factory)
		{
			//could be a core function - try it.
			if(typeof require != 'undefined') return nodeRequire(path);

			moduleDoesntExist(fullPath);
		}

		var module = { exports: { } };

		var cwd = fullPath.match(/\.js$/) ? dirname(fullPath) : fullPath,
		modRequire = function(path)
		{
			return req(path, cwd);
		}

		modRequire.resolve = req.resolve;
		modRequire.paths = [];

		factory(modRequire, module, module.exports, cwd, fullPath);

		return _sardines.modules[fullPath] = module.exports;
	}

	function normalizeArray(v, keepBlanks) {
		var L = v.length,
		dst = new Array(L),
		dsti = 0,
		i = 0,
		part, negatives = 0,
		isRelative = (L && v[0] !== '');
		for (; i < L; ++i) {
			part = v[i];
			if (part === '..') {
				if (dsti > 1) {
					--dsti;
				} else if (isRelative) {
					++negatives;
				} else {
					dst[0] = '';
				}
			} else if (part !== '.' && (dsti === 0 || keepBlanks || part !== '')) {
				dst[dsti++] = part;
			}
		}
		if (negatives) {
			dst[--negatives] = dst[dsti - 1];
			dsti = negatives + 1;
			while (negatives--) {
				dst[negatives] = '..';
			}
		}
		dst.length = dsti;
		return dst;
	}

	function normalizePath(path) {
		return normalizeArray(path.split("/"), false).join("/");
	}

	function relateToAbsPath(path, cwd)
	{
		//root
		if(path.substr(0, 1) == '/') return path;

		//relative
		if(path.substr(0, 1) == '.') return cwd + '/' + path;

		return path;
	}

	function findModulePath(path)
	{
		var tryPaths = [path, path + '/index.js', path + '.js'],
		modulePaths = ['modules',''];


		for(var j = modulePaths.length; j--;)
		{
			for(var i = tryPaths.length; i--;)
			{
				var fullPath = normalizePath('/'+modulePaths[j]+'/'+tryPaths[i]);
				
				if(_sardines.moduleFactories[fullPath]) return fullPath;
			}
		}		
	}

	req.resolve = function(path, cwd)
	{
		return findModulePath(normalizePath(relateToAbsPath(path, cwd))) || nodeRequire.resolve(path);
	}

	return {
		allFiles: allFiles,
		moduleFactories: { },
		modules: { },
		require: req,
		register: register
	}
})();

_sardines.register("/modules/daisy/index.js", function(require, module, exports, __dirname, __filename) {
	//#include ./plugins

var winston = require('mesh-winston');


exports.plugin = function(router, params)
{
	this.params({
		'hooks.core': params
	});

	this.require(__dirname + '/plugins');
}
});

_sardines.register("/modules/mesh-winston/index.js", function(require, module, exports, __dirname, __filename) {
	var loggers = {};

var newLogger = function(module) {

	function logger(name) {

		return function(msg) {
			console.log(name + ": " + module + ": " + msg);
		}	
	}

	return {
		info: logger('info'),
		warn: logger('warn'),
		error: logger('error'),
		debug: logger('debug'),
		verbose: logger('verbose')
	};
}


exports.loggers = {
	get: function(name) {
		return loggers[name] || (loggers[name] = newLogger(name))
	}
}
});

_sardines.register("/modules/daisy/plugins/hooks.transport.jsonp/transport.js", function(require, module, exports, __dirname, __filename) {
	var Structr = require('structr'),
qs = require('querystring'),
logger = require('mesh-winston').loggers.get('daisy');

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
	
	'broadcast': function(path, message, headers)  {
		var self = this;
		
		//don't return basic auth
		message.basicAuth = false;
		
		//not everything supports DELETE UPDATE
		message.httpMethod = headers.tags.method || 'GET';

		var url = this.protocol + '//' + this.host + '/' + path + '.json';

		function onResponse(response) {

			headers.type = !headers.hasNext || response.errors ? 'response' : 'next';
					
			self.onMessage({ data: response }, headers, self.host);
		}

		function onError(err) {
			self.onMessage({ error: err }, headers, self.host);
		}


		//easyXDM?
		if(this.rpc) {

			this.rpc.request({
				url: url,
				data: { json: JSON.stringify(message) },
				method: "GET",
				type: 'json'
			}, onResponse, onError);

		} else
		//titanium?
		if(typeof Titanium != undefined) {

			alert("FUCK YEAH TITANIUM");
			
		} else {

			$.ajax({
				url: url + '?json='+ encodeURIComponent(JSON.stringify(message)),
				dataType: 'jsonp',
				success: onResponse
			});	

		}
		
		return true;
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
});

_sardines.register("/modules/daisy/plugins/hooks.transport.jsonp/index.js", function(require, module, exports, __dirname, __filename) {
	
exports.plugin = function(router) {
 
	return {
		transport: require('./transport')
	};
}
});

_sardines.register("/modules/daisy/plugins/hooks.core/utils.js", function(require, module, exports, __dirname, __filename) {
	var _ = require('underscore');


exports.generalizeParams = function(path) {

	var params = path.match(/\:\w+/g);

	if(params) {
		for(var i = 0, n = params.length; i < n; i++) {

			path = path.replace('/'+params[i], '/:__param' + i);

		}
	}


	return path;
}


exports.siftPaths = function(router) {

	return _.map(router.paths({ siftTags: exports.tagSearch }), function(path) {
		return { path: path.value, type: path.type };
	})

}


exports.tagSearch = {
	$and: [ 
		{ hook: { $exists: true } } ,
		{ hooked: { $exists: false } }
	] 
};
});

_sardines.register("/modules/daisy/plugins/hooks.core/transports.js", function(require, module, exports, __dirname, __filename) {
	var Structr = require('structr'),
utils = require('./utils'),
Transactions = require('./transactions'),
vine = require('vine'),
_ = require('underscore'),
beanpoll = require('beanpoll'),
crema = require('crema'),
logger = require('winston').loggers.get('daisy'),
sprintf = require('sprintf').sprintf,
EventEmitter = require('events').EventEmitter;

var Response = {
	next: 'next',
	response: 'response'
}

var Request = {
	body: 'body'
}


function cleanPath(path) {

	return path.replace(/^\/+|\/+$/,'');

}

 
var TransportWrapper = Structr({
	
	/**
	 */
	
	'__construct': function(collection, transport, name) {

		this._em = new EventEmitter();
		this._em.setMaxListeners(0);

		this.name = name;

		//the collection that holds all the transports
		this._collection = collection;

		//the scope of queues to bind to
		this.scope = collection.scope || [];

		
		//the router that handles all the path requests
		this._router = collection._router;
		
		//the transport which broadcasts routes over the network
		this._transport = transport;
		
		//paths we've already hooked into
		this._hooked = {};

		this._remoteRouters = {};

		
		//any paths which should be ignored. This is a dirty method of making sure requests
		//don't get re-broadcasted out to the same transport
		this._ignore = {};
		
		//controls transactions between two servers
		this._transactions = new Transactions(transport);


		//kill transactions after N seconds
		this._killTimeout = 1000 * 20;
		
		//called back when the app first starts up, and when new apps are introduced
		transport.onHandshake = this.getMethod('onHandshake');
		
		//called when an app on the network is sending a request that *this* app can handle
		transport.onMessage = this.getMethod('onMessage');
		
		//what happens when a call is made to a path that doens't exist
		transport.onNoRoute = this.getMethod('onNoRoute');

		//
		transport.onConnected = this.getMethod('onConnected');

		transport.onDisconnected = this.getMethod('onDisconnected');

		var self = this;

		this._router.on('push -hook announce/:appName', function() {

			this.from.request(name + '/ready').header('queue', null).push(undefined);
		});

		this._router.on('pull ' + name + '/ready', function(req, res) {
			res.end();
		});

	},

	/**
	 */

	'on': function(type, callback) {
		this._em.on(type, callback);
	},

	/**
	 */

	'once': function(type, callback) {
		this._em.once(type, callback);
	},
	
	/**
	 * publishes *public* hooks to the network. Any app can call these.
	 */
	
	'publishHooks': function(hooks) {

		var self = this;
		
		hooks.forEach(function(hook) {


			self._hooked[cleanPath(utils.generalizeParams(hook.path))]  = 1;

			logger.verbose(sprintf('publish hook %s', hook.path));
		});
		
		this._transport.publishHooks(hooks);
	},
	
	/**
	 * When new apps come in, register their hooks
	 */
	
	'onHandshake': function(handshake) {                           
		var self = this;




		if(handshake.hooks instanceof Array) {

			handshake.hooks.forEach(function(hook) {
				self._hook(hook);
			});

		} else {

			for(var route in handshake.hooks) {

				var info = handshake.hooks[route];

				self._hook(route, info.t, info.a);	
					
			}

		}
	},

	/**
	 */
	'onDisconnected': function() {
	},

	/**
	 */

	'onConnected': function() {
		//TODO - push reconnect
		if(this._announced) return;
		this._announced = true;


		this._router.request('announce/' + this.name).header('queue', null).push(undefined);
		this._em.emit('connect');
	},
	
	/**
	 * handle any message from a server
	 */
	
	'onMessage': function(data, headers, from) {

		if(headers.type in Response) {

			this._onResponse(data, headers, from);

		} else {

			this._ignore[headers.path] = 1;
			this._onRequest(data, headers, from);
			delete this._ignore[headers.path];

		}
	},
	
	/**
	 */
	
	'onNoRoute': function(path) {      
	                             

		(this._transactions.live(path) || []).forEach(function(transaction) {

			transaction.emit('response', { error: 'Route ' + path + ' does not exist' });

		});
	},
	
	/**
	 */
	
	'_onRequest': function(payload, headers, from)
	{           
		var self = this,
		fromRouter = this._from(from),
		responded = false,
		respond = function(response, type) {

			//this WILL happen on items such as push routes
			if(responded) return;
			responded = true;

			self._transport.direct(from.replyTo, response, { transactionId: headers.transactionId, type: type } );
		};


		logger.verbose(sprintf('hooked %s %s', headers.type.toUpperCase(), headers.path));


		var req = this._router.request(headers.path).

		//type of route: push, pull, collect, etc.
		type(headers.type).

		//point back to the remote router
		from(fromRouter).

		headers(payload.headers).

		query(payload.query).

		//only hooked items can be processed
		tag('hook', true).

		//the ack callback
		response(function(err, data) {

			//some errors CANNOT be serialized for some reason
			respond({ error: err ? { message: err.message, stack: err.stack } : null, data: data ? data : null }, Response.response);

		});


		//this happens with services such as rabbitmq where you might
		//have a CLUSTER of applications which use the same queues
		if(from.isSelf) {

			respond({ error: new Error('cannot handle self') }, Response.response);
			return;
		}

		if(!req.hasListeners()) {
			
			logger.verbose(sprintf('path %s does not exist', headers.path));

			respond({ error: new Error('route does not exist') }, Response.response);
			return;
		}


		if(headers.hasNext) {

			req.next(function() {

				respond(null, Request.next);

			})
		}

		req.dispatch().end(payload.data);

		
	},        
	
	
	/**
	 */
	
	'_from': function(from) {
	                   	
		var queue = from.name,
		replyTo = from.replyTo;
		              
		var transactions = this._transactions, self = this;

		if(this._remoteRouters[replyTo]) return this._remoteRouters[replyTo];



		var router = /*this._remoteRouters[replyTo] =*/ beanpoll.router();
		router.use(this._router.using());
		router.name = replyTo;



		Object.keys(this._hooked).forEach(function(path) {

			Object.keys(router.directors).forEach(function(type) {

				router.on(path, { type: type }, function(req, res, mw) {
							
					var mw = this,
					msg = mw.request;

					self._dispatch(mw, type, crema.stringifySegments(mw.current.path.segments, mw.current.params), replyTo);
				});

			})
		});

		return router;
	},


	
	/**
	 */
	
	'_onResponse': function(data, headers, from) {

		var trans = this._transaction(headers);

		if(!trans) return;
		
		trans.emit(headers.type, data);      
	},

	
	/**
	 */
	 
	'_transaction': function(headers) {

		var trans = this._transactions.live(headers.transactionId);


		//this WILL happen when fanouts are acknowledged, such as push.
		if(!trans) return null;//console.error('Transaction %s does not exist', headers.transactionId);

		return trans;
		
	},

	/**
	 */

	'_getQueue': function(path) {

		if(!this.scope.length) return null;

		var queues = this._hooked[path] || [];


		return _.intersection(queues, this.scope);
	},
	
	/**
	 * hooks a *remote* route to the app
	 */
	
	'_hook': function(route, types, queues) {

		var path;

		if(typeof route == 'object') {
			types = [route.type];
			path = route.path;
		} else {
			path = route;
		}

		if(!types) types = [];
		if(!queues) queues = [];


		path = cleanPath(path);

		
		//router
		var r        = this._router,

		//routes to ignore - incomming remote calls are ignored
		ignore       = this._ignore,

		//transport to use - JSONP? AMQP?
		transport    = this._transport,

		//transactions ~ push/pull 
		transactions = this._transactions,

		self = this;

		this._hooked[path] = queues || [];
		
		try {

			var pathExpr = crema.parsePath(path);


			types.forEach(function(type) {

				var director = r.director(type),
				req = r.request(path).type(type),
				hasListener = req.exists(),
				hasPrivate = req.tag('private', true).exists();


				if(hasPrivate || (hasListener && !director.passive)) return;

				// if(hasPrivate || (r.routeExists({ path: channelExpr }) && (!hasListener || director.passive))) return;


				logger.verbose(sprintf('hooking %s %s', type, path));
				
				r.on(path, { tags: { hooked: '*', unfilterable: '*', stream: true, priority: -999999 }, type: type }, function(req, res) {

					var mw = this, 
					msg = mw.request,
					params = msg.params;

					path = crema.stringifySegments(mw.current.path.segments, mw.current.params);

					if(msg.from != self._router || msg.headers.ignoreHook) {
						throw new Error('cannot proxy "' + path + '" request');
					}

					self._dispatch(mw, type, path, msg.headers.queue !== undefined ? msg.headers.queue : self._getQueue(path));
				});

			});

		} catch(e) {
			logger.error(e, { stack: e.stack });
		}


		

	},


	'_dispatch': function(mw, type, path, queue) {
		
		var msg = mw.request, self = this;


		logger.verbose(sprintf('remote %s %s', type.toUpperCase(), path))


		function respond(err, result) {

			if(mw.response.sentHeaders) return;

			if(err) logger.error(err, { stack: err.stack });

			if(err) return mw.response.error(new Error(err.message));

			mw.response.end(result);

		}

		function onData(err, result) {

			if(err) return respond(err);


			var transaction = self._transactions.
			create(path).
			prepare(type, {
				queue: queue,
				tags: msg.filter, //check this tomorrow Friday, February 03, 2012
				payload: {
					data: result || true,
					query: _.defaults(msg.query || {}, self._collection._stickyData || {}),
					headers: msg.headers
				},
				hasNext: mw.hasNext,
				next: function() {
					mw.next()
				}
			}).
			register({ timeout: self._killTimeout });


			transaction.onEnd('response', function(response) {

				respond(response.error, response.data);

			});		

			var success = transaction.send();


			//probably out of scope
			if(!success) {
				transaction.dispose();
				respond(new Error('Could not send '+path+'. Most likely a target was not set.'));
			}
		}

		//dump incomming data - we CANNOT pipe it over the network
		//since some transports don't support it, such as rabbitmq. With rabbit,
		//piping data will be round-robbined around queues. 
		//msg.dump(onData);

		onData();
	}
});


module.exports = Structr({
	
	/**
	 */
	
	'__construct': function(router, scope, remoteName) {

		this.remoteName = remoteName;
		this._router = router;
		this._transports = [];
		this._stickyData = {}
		this.scope = scope;

	},
	
	/**
	 */
	
	'addStickyData': function(data) {

		Structr.copy(data || {}, this._stickyData, true);

	},
	
	/**
	 */
	
	'publishHooks': function(hooks) {

		this._transports.forEach(function(transport) {

			transport.publishHooks(hooks);

		});
	},
	
	/**
	 */
	
	'add': function(transport) {

		var wrapper = new TransportWrapper(this, transport, this.remoteName);
		
		this._transports.push(wrapper);

		wrapper.publishHooks(utils.siftPaths(this._router));

		return wrapper;
	}
});
});

_sardines.register("/modules/daisy/plugins/hooks.core/transactions.js", function(require, module, exports, __dirname, __filename) {
	var Structr = require('structr'),
EventEmitter = require('events').EventEmitter,
cashew = require('cashew'),
logger = require('winston').loggers.get('daisy');
sprintf = require('sprintf').sprintf;

var Transaction = Structr({
	
	/**
	 */

	'__construct': function(name, id, collection) {

		this._name = name;
		this._id = id;
		this._collection = collection;
		
		this._em = new EventEmitter();
		this._em.setMaxListeners(0);
	},
	
	/**
	 */
	
	'emit': function(type, data) {

		this._em.emit(type, data);

	},
	
	
	/**
	 */

	'prepare': function(type, ops) {

		var self = this;
		
		if(ops.hasNext) {

			this.register();
			
			this._em.on('next', ops.next);
		}
		
		var tags = ops.tags || {};
		
		//undefined breaks amqp
		for(var key in tags) if(!tags[key]) tags[key] = 1;
		                
		                
		this._headers = { type: type, 
			hasNext: !!ops.hasNext,
			transactionId: this._id,     
			path: this._name,
			tags: tags }; 
			                                       
		this._queue = ops.queue || tags.queue;    
		this._payload  = ops.payload;

		
		return this;
	},  
	
	/**
	 */
	
	'send': function() {

		var success = false;

		if(this._queue) {   
		                         
			success = this._collection._transport.direct(this._queue, this._payload, this._headers);

		} else { 
		                           
			success = this._collection._transport.broadcast(this._name, this._payload, this._headers);
		}
	
		return success;                                                                         
	},
	          
	/**
	 */

	'on': function(listen) {

		for(var type in listen) {

			this.on(type, listen[type])

		}

		return this;
	},


	/**
	 */

	'second on': function(type, listener) {

		this._em.addListener(type, listener);
		return this;
	},


	/**
	 * the end callback
	 */

	'onEnd': function(type, listener) {

		var self = this;
		this.on(type, listener);
		this.on(type, function() {
			self.dispose();
		});
	},

	/**
	 */

	'register': function(ops) {

		if(this._collection._addTransaction(this)) {

			//timeout for N seconds before killing
			if(ops && ops.timeout) {
				this._killTimeout = setTimeout(this.getMethod('kill'), ops.timeout);
			}
		}

		return this;
	},

	/**
	 */

	'onError': function(e) {
		this._em.emit('error', e);
		return this;
	},

	/**
	 */

	'dispose': function() {

		clearTimeout(this._killTimeout);
		this._em.removeAllListeners();
		this._collection._remove(this);
	},

	/**
	 */

	'kill': function() {
		logger.warn(sprintf('transaction %s has been killed - id: ', this._headers.path, this._id));
		this._em.emit('response', { error: new Error('Transaction '+this._headers.path+' timeout') });
		this.dispose();
	}
});         

var Collection = Structr({
	
	/**
	 */
	
	'__construct': function() {
	   this._col = {}; 
	},
	
	/**
	 */
	
	'add': function(key, value) {                     
		if(!key) return;                   
		
		if(!this._col[key]) this._col[key] = [];  
		                            
		     
		this._col[key].push(value);
	},
	
	/**
	 */
	
	'remove': function(key, value) {
		if(!key || !this._col[key]) return;
		
		var i = this._col[key].indexOf(value);
		
		if(i > -1) this._col[key].splice(i, 1);      
		
		if(!this._col[key].length) delete this._col[key];
	},
	
	/**
	 */
	
	'stack': function(key) {

		return this._col[key];

	}
})



module.exports = Structr({

	/**
	 */

	'__construct': function(transport) {

		this._live 			= {};
		this._transport 	= transport;
		this._liveByQueue   = new Collection();       
		this._liveByPath    = new Collection();   
        this._idGen 		= cashew.register('hook.core');
	},
	
	/**
	 */
	
	'create': function(name) {

		return new Transaction(name, this._idGen.uid(), this);

	},

	
	/**
	 */
	
	'live': function(uidOrPathOrQueue) { 
	                                           
		return this._live[ uidOrPathOrQueue ] || this._liveByPath.stack(uidOrPathOrQueue) || this._liveByQueue.stack(uidOrPathOrQueue);
	
	},

	/**
	 */

	'_addTransaction': function(trans) {

		if(this._live[ trans._id ]) return false;		                 
	            
		this._live[ trans._id ] = trans;                                    
		this._liveByPath.add(trans._name, trans);
		this._liveByQueue.add(trans._queue, trans);

		return true;
	},


	/**
	 */
	
	'_remove': function(trans) {   
	                      
		if(this._live[trans._id]) {

			delete this._live[trans._id];   
			
			this._liveByPath.remove(trans._name, trans); 
			this._liveByQueue.remove(trans._queue, trans);  
			                                        
		}
		
		return trans;
	}
	
});
});

_sardines.register("/modules/daisy/plugins/hooks.core/index.js", function(require, module, exports, __dirname, __filename) {
	var utils = require('./utils'),
Transports = require('./transports'),
vine = require('vine'),
logger = require('winston').loggers.get('daisy'),
sprintf = require('sprintf').sprintf;

	
exports.plugin = function(router, params) {




	//target hooks
	var target = params.target || params.transport || {},
	remoteName = params.name,
	transports = new Transports(router, params.scope, remoteName),
	transportTypes = {};


	if(!remoteName) throw new Error('A name must be provided for your app');


	
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

	router.on({

		/**
		 * connect before starting up this app
		 */

		'pull load/*': function(req, res, mw) {
			logger.verbose('loading daisy');


			for(var name in target) {
				
				var transport = transportTypes[name];


				if(!transport) continue;

				//can be multiple hooks to a particular transport.
				var transportConfigs = target[transport.name];
				
				if(!(transportConfigs instanceof Array)) transportConfigs = [transportConfigs];
				
				var running = transportConfigs.length;

				if(!running) return mw.next();
				
				transportConfigs.forEach(function(cfg)
				{
					
					//set the queue name
					cfg.name = remoteName;
					
					transports.add(transport.connect(cfg)).once('connect', function() {
						if(!(--running)) {
							logger.verbose('loaded daisy');
							mw.next();
						}
					})
				})
			}
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
});

_sardines.register("/modules/structr/lib/index.js", function(require, module, exports, __dirname, __filename) {
	var Structr = function ()
{
	var that = Structr.extend.apply(null, arguments);

	if(!that.structurized) {
		that = Structr.ize(that);
	}

	for(var prop in that) {
		that.__construct.prototype[prop] = that[prop];
	}


	if(!that.__construct.extend) {
		//allow for easy extending.
		that.__construct.extend = function()
		{
			return Structr.apply(null, [that].concat(Array.apply([], arguments)))
		};
	}

	//return the constructor
	return that.__construct;
}; 



Structr.copy = function (from, to, lite)
{
	if(typeof to == 'boolean')
	{
		lite = to;
		to = undefined;
	}
	
	if (!to) to = from instanceof Array ? [] : {};  
	
	var i;

	for(i in from) 
	{
		var fromValue = from[i],
		toValue = to[i],
		newValue;

		//don't copy anything fancy other than objects and arrays. this could really screw classes up, such as dates.... (yuck)
		if (!lite && typeof fromValue == 'object' && (!fromValue || fromValue.constructor.prototype == Object.prototype || fromValue instanceof Array)) 
		{

			//if the toValue exists, and the fromValue is the same data type as the TO value, then
			//merge the FROM value with the TO value, instead of replacing it
			if (toValue && fromValue instanceof toValue.constructor)
			{
				newValue = toValue;

			}

			//otherwise replace it, because FROM has priority over TO
			else
			{
				newValue = fromValue instanceof Array ? [] : {};
			}

			Structr.copy(fromValue, newValue);
		}
		else 
		{
			newValue = fromValue;
		}

		to[i] = newValue;
	}

	return to;
};


//returns a method owned by an object
Structr.getMethod = function (that, property)
{
	return function()
	{
		return that[property].apply(that, arguments);
	};
};     

Structr.wrap = function(that, prop)
{
	if(that._wrapped) return that;

	that._wrapped = true;

	function wrap(target)
	{
		return function()
		{
			return target.apply(that, arguments);
		}
	}

	if(prop)
	{
		that[prop] = wrap(target[prop]);
		return that;	
	}

	for(var property in that)
	{
		var target = that[property];
			
		if(typeof target == 'function')
		{
			that[property] = wrap(target);
		}
	}

	return that;
}  

//finds all properties with modifiers
Structr.findProperties = function (target, modifier)
{
	var props = [],
		property;

	for(property in target)
	{
		var v = target[property];

		if (v && v[modifier])
		{
			props.push(property);
		}
	}

	return props;
};

Structr.nArgs = function(func)
{
	var inf = func.toString().replace(/\{[\W\S]+\}/g, '').match(/\w+(?=[,\)])/g);
	return inf ? inf.length :0;
}

Structr.getFuncsByNArgs = function(that, property)
{
	return that.__private['overload::' + property] || (that.__private['overload::' + property] = {});
}

Structr.getOverloadedMethod = function(that, property, nArgs)
{
	var funcsByNArgs = Structr.getFuncsByNArgs(that, property);
	
	return funcsByNArgs[nArgs];
}

Structr.setOverloadedMethod = function(that, property, func, nArgs)
{
	var funcsByNArgs = Structr.getFuncsByNArgs(that, property);
	
	if(func.overloaded) return funcsByNArgs;
	
	funcsByNArgs[nArgs || Structr.nArgs(func)] = func;
	
	return funcsByNArgs;
}

//modifies how properties behave in a class
Structr.modifiers =  {

	/**
	* overrides given method
	*/

	m_override: function (that, property, newMethod)
	{
		var oldMethod = (that.__private && that.__private[property]) || that[property] || function (){},
			parentMethod = oldMethod;
		
		if(oldMethod.overloaded)
		{
			var overloadedMethod = oldMethod,
				nArgs = Structr.nArgs(newMethod);
			parentMethod = Structr.getOverloadedMethod(that, property, nArgs);
		}
		
		//wrap the method so we can access the parent overloaded function
		var wrappedMethod = function ()
		{
			this._super = parentMethod;
			var ret = newMethod.apply(this, arguments);
			delete this._super;
			return ret;
		}
		
		if(oldMethod.overloaded)
		{
			return Structr.modifiers.m_overload(that, property, wrappedMethod, nArgs);
		}
		
		return wrappedMethod;
	},


	/**
	* getter / setter which are physical functions: e.g: test.myName(), and test.myName('craig')
	*/

	m_explicit: function (that, property, gs)
	{
		var pprop = '__'+property;

		//if GS is not defined, then set defaults.
		if (typeof gs != 'object') 
		{
			gs = {};
		}

		if (!gs.get) 
		gs.get = function ()
		{
			return this._value;
		}

		if (!gs.set) 
		gs.set = function (value)
		{
			this._value = value;
		}


		return function (value)
		{
			//getter
			if (!arguments.length) 
			{
				this._value = this[pprop];
				var ret = gs.get.apply(this);
				delete this._value;
				return ret;
			}

			//setter
			else 
			{
				//don't call the gs if the value isn't the same
				if (this[pprop] == value ) 
				return;

				//set the current value to the setter value
				this._value = this[pprop];

				//set
				gs.set.apply(this, [value]);

				//set the new value. this only matters if the setter set it 
				this[pprop] = this._value;
			}
		};
	},

    /**
 	 */

	m_implicit: function (that, property, egs)
	{
		//keep the original function available so we can override it
		that.__private[property] = egs;

		that.__defineGetter__(property, egs);
		that.__defineSetter__(property, egs);
	},
	
	/**
	 */
	
	m_overload: function (that, property, value, nArgs)
	{                    
		var funcsByNArgs = Structr.setOverloadedMethod(that, property, value, nArgs);
				
		var multiFunc = function()
		{          
			var func = funcsByNArgs[arguments.length];
			
			if(func)
			{
				return funcsByNArgs[arguments.length].apply(this, arguments);
			}             
			else
			{
				var expected = [];
				
				for(var sizes in funcsByNArgs)
				{
					expected.push(sizes);
				}
				
				throw new Error('Expected '+expected.join(',')+' parameters, got '+arguments.length+'.');
			}
		}    
		
		multiFunc.overloaded = true;                                          
		
		return multiFunc; 
	}
}              

function getWrappedStep(property, index, steps)
{
	return function() {

		var args = arguments;

		
		this.next = function() {
			steps[index + 1].apply(this, args);
		}

		this[property].apply(this, args);

		this.next = undefined;
	}
} 

function getStepper(inner, middleware, last) {

	var steps = [];

	for(var i = 0, n = middleware.length; i < n; i++) {
		steps.push(getWrappedStep(middleware, i, steps));
	}


	steps.push(last);

	return function() {

		steps[0].apply(this, arguments);
	};
}


//check for middleware: some -> value
function wrapAround(target, property) 
{
	
	var fn = target[property];
		
	if(property.indexOf('->') == -1) return { property: property, value: fn };

	var mw = property.split(/\s*->\s*/g),
	accessorParts = mw[0].split(' ');

	mw[0] = accessorParts.pop();
	accessorParts.push(mw[mw.length - 1]);

	mw.pop();


	return { property: accessorParts.join(' '), value: getStepper(target, mw, fn) };
}


//extends from one class to another. note: the TO object should be the parent. a copy is returned.
Structr.extend = function ()
{
	var from = {},
	mixins = Array.apply([], arguments),
	to = mixins.pop();


	if(mixins.length > 1) {
		from = Structr.extend.apply(null, mixins);
	} else {
		from = mixins.pop() || from;
	}


	//class? fetch the prototype
	if(typeof from == 'function') {

		var fromConstructor = from;

		//copy the prototype to make sure we don't modify it.
		from = Structr.copy(from.prototype);

		//next we need to convert the class into something we can handle
		from.__construct = fromConstructor;

	}



	var that = {
		__private: {

			//contains modifiers for all properties of object
			propertyModifiers: {}
		}
	};


	Structr.copy(from, that);

	var usedProperties = {},
	property;


	for(property in to) 
	{
		/*var propInfo = wrapAround(to, property),
		property = propInfo.property,
		value = propInfo.value;*/

		var value = to[property];


		var propModifiersAr = property.split(' '), //property is at the end of the modifiers. e.g: override bindable testProperty
		propertyName = propModifiersAr.pop(),

		modifierList = that.__private.propertyModifiers[propertyName] || (that.__private.propertyModifiers[propertyName] = []);
                                
             
		if (propModifiersAr.length) 
		{
			var propModifiers = {};
			for(var i = propModifiersAr.length; i--;) 
			{
				var modifier = propModifiersAr[i];

				propModifiers['m_' + propModifiersAr[i]] = 1;

				if (modifierList.indexOf(modifier) == -1)
				{
					modifierList.push(modifier);
				}
			}      
			
			if(propModifiers.m_merge)
			{
				value = Structr.copy(from[propertyName], value);
			}         

			//if explicit, or implicit modifiers are set, then we need an explicit modifier first
			if (propModifiers.m_explicit || propModifiers.m_implicit) 
			{
				value = Structr.modifiers.m_explicit(that, propertyName, value);
			}

			if (propModifiers.m_override) 
			{
				value = Structr.modifiers.m_override(that, propertyName, value);
			}

			if (propModifiers.m_implicit) 
			{
				//getter is set, don't continue.
				Structr.modifiers.m_implicit(that, propertyName, value);
				continue;
			}
		}

		for(var j = modifierList.length; j--;)
		{
			value[modifierList[j]] = true;
		}
		
		if(usedProperties[propertyName])
		{                       
			var oldValue = that[propertyName];
			
			//first property will NOT be overloaded, so we need to check it here
			if(!oldValue.overloaded) Structr.modifiers.m_overload(that, propertyName, oldValue, undefined);
			 
			value = Structr.modifiers.m_overload(that, propertyName, value, undefined);
		}	
		
		usedProperties[propertyName] = 1;

		that.__private[propertyName] = that[propertyName] = value;
	}

	//if the parent constructor exists, and the child constructor IS the parent constructor, it means
	//the PARENT constructor was defined, and the  CHILD constructor wasn't, so the parent prop was copied over. We need to create a new function, and 
	//call the parent constructor when the child is instantiated, otherwise it'll be the same class essentially (setting proto)
	if (that.__construct && from.__construct && that.__construct == from.__construct)
	{
		that.__construct = Structr.modifiers.m_override(that, '__construct', function()
		{
			this._super.apply(this, arguments);
		});
	}
	else
	if(!that.__construct)
	{
		that.__construct = function() {};
	}


	//copy the static methods.
	for(var property in from.__construct)
	{

		//make sure it's static. Don't want copying the prototype over. Also make sure NOT to override any
		//static methods on the new obj
		if(from.__construct[property]['static'] && !that[property])
		{
			that.__construct[property] = from.__construct[property];
		}
	}

     
	var propertyName;
	
	//apply the static props
	for(propertyName in that) 
	{
		var value = that[propertyName];

		//if the value is static, then tack it onto the constructor
		if (value && value['static'])
		{
			that.__construct[propertyName] = value;
			delete that[propertyName];
		}                                                                  
	}



	return that;
}


//really.. this isn't the greatest idea if a LOT of objects
//are being allocated in a short perioud of time. use the closure
//method instead. This is great for objects which are instantiated ONCE, or a couple of times :P.
Structr.fh = function (that)
{
	if(!that) {
		that = {};
	}

	that = Structr.extend({}, that);


	return Structr.ize(that);
}

Structr.ize = function(that) {

	that.structurized = true;

	//deprecated
	that.getMethod = function (property)
	{
		return Structr.getMethod(this, property);
	}

	that.extend = function ()
	{
		return Structr.extend.apply(null, [this].concat(arguments))
	}

	//copy to target object
	that.copyTo = function (target, lite)
	{
		Structr.copy(this, target, lite);
	}   

	//wraps the objects methods so this always points to the right place
	that.wrap = function(property)
	{
		return Structr.wrap(this, property);
	}

	return that;
}
                                        
module.exports = Structr;


});

_sardines.register("/modules/structr", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/structr/lib/index.js');
});

_sardines.register("/modules/querystring", function(require, module, exports, __dirname, __filename) {
	// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Query String Utilities

var QueryString = exports;


function charCode(c) {
  return c.charCodeAt(0);
}


QueryString.unescape = function(s, decodeSpaces) {
  return decodeURIComponent(s);////QueryString.unescapeBuffer(s, decodeSpaces).toString();
};


QueryString.escape = function(str) {
  return encodeURIComponent(str);
};

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};


QueryString.stringify = QueryString.encode = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  obj = (obj === null) ? undefined : obj;

  switch (typeof obj) {
    case 'object':
      return Object.keys(obj).map(function(k) {
        if (Array.isArray(obj[k])) {
          return obj[k].map(function(v) {
            return QueryString.escape(stringifyPrimitive(k)) +
                   eq +
                   QueryString.escape(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return QueryString.escape(stringifyPrimitive(k)) +
                 eq +
                 QueryString.escape(stringifyPrimitive(obj[k]));
        }
      }).join(sep);

    default:
      if (!name) return '';
      return QueryString.escape(stringifyPrimitive(name)) + eq +
             QueryString.escape(stringifyPrimitive(obj));
  }
};

// Parse a key=val string.
QueryString.parse = QueryString.decode = function(qs, sep, eq) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  qs.split(sep).forEach(function(kvp) {
    var x = kvp.split(eq);
    var k = QueryString.unescape(x[0], true);
    var v = QueryString.unescape(x.slice(1).join(eq), true);

    if (!obj.hasOwnProperty(k)) {
      obj[k] = v;
    } else if (!Array.isArray(obj[k])) {
      obj[k] = [obj[k], v];
    } else {
      obj[k].push(v);
    }
  });

  return obj;
};

});

_sardines.register("/modules/underscore/underscore.js", function(require, module, exports, __dirname, __filename) {
	//     Underscore.js 1.2.2
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js** and **"CommonJS"**, with
  // backwards-compatibility for the old `require()` API. If we're not in
  // CommonJS, add `_` to the global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else if (typeof define === 'function' && define.amd) {
    // Register as a named module with AMD.
    define('underscore', function() {
      return _;
    });
  } else {
    // Exported as a string, for Closure Compiler "advanced" mode.
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.2.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and another.
  // Only the elements present in just the first array will remain.
  _.difference = function(array, other) {
    return _.filter(array, function(value){ return !_.include(other, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (_.isFunction(a.isEqual)) return a.isEqual(b);
    if (_.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return String(a) == String(b);
      case '[object Number]':
        a = +a;
        b = +b;
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != a ? b != b : (a == 0 ? 1 / a == 1 / b : a == b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ("constructor" in a != "constructor" in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (hasOwnProperty.call(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (hasOwnProperty.call(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  if (toString.call(arguments) == '[object Arguments]') {
    _.isArguments = function(obj) {
      return toString.call(obj) == '[object Arguments]';
    };
  } else {
    _.isArguments = function(obj) {
      return !!(obj && hasOwnProperty.call(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape, function(match, code) {
           return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
         })
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + ";__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    return data ? func(data, _) : function(data) { return func(data, _) };
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

});

_sardines.register("/modules/underscore", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/underscore/underscore.js');
});

_sardines.register("/modules/vine/index.js", function(require, module, exports, __dirname, __filename) {
	var outcome = require('outcome'),
EventEmitter = require('events').EventEmitter;


//meh, shit's ugly.
function combineArrays(c1,c2,target,property)
{
	var c1p = c1[property];
		c2p = c2[property];
		
	if(!c1p && !c2p) return;
	
	c1p = c1p || [];
	c2p = c2p || [];
	
	c1p = c1p instanceof Array ? c1p : [c1p];
	c2p = c2p instanceof Array ? c2p : [c2p];
	
	target[property] = c1p.concat(c2p);
}

function _buildMessage()
{
	var msg = arguments[0];

	//error object
	if(msg.message) msg = msg.message;
	
	for(var i = 1, n = arguments.length; i < n; i++)
	{
		msg = msg.replace(/%\w/, arguments[i]);
	}
	
	return msg;
}


var Vine = 
{

	/**
	 */
	 
	setApi: function(request)
	{
		request.api = Vine.api(request);
		
		return request;
	},

	/**
	 */

	api: function(request,methods,data)
	{
		if(!data) data = {};
		
		var methods  = methods || {};
		

		var invoker = 
		{

			/**
			 */

			error: function()
			{
				if(!arguments.length) return data.errors;

				if(arguments[0] instanceof Array) {
					arguments[0].forEach(function(err) {
						invoker.error(err);
					})
					return this;
				}
				
				if(!data.errors) data.errors = [];
				
				data.errors.push({ message: _buildMessage.apply(null, arguments)});
				return this;
			},


			/**
			 * the type of data. Used for 
			 */

			type: function(type)
			{
				if(!arguments.length) return data.type;

				data.type = type;

				return this;
			},

			/**
			 */
			 
			warning: function()
			{
				if(!arguments.length) return data.warnings;
				
				if(!data.warnings) data.warnings = [];
				
				data.warnings.push({ message: _buildMessage.apply(null, arguments)});
				return this;
			},
			
			/**
			 */
			
			'success': function()
			{
				if(!arguments.length) return data.messages;
				
				if(!data.messages) data.messages = [];
				
				data.messages.push({ message: _buildMessage.apply(null, arguments)});
				
				return this;
			},
			
			/**
			 */
			 
			combine: function(api)
			{
				var thisData = data,
					thatData = api.data || api,
					newData = {};
					
				for(var i in thisData) newData[i] = thisData;
				
				combineArrays(thisData,thatData,newData,'errors');
				combineArrays(thisData,thatData,newData,'warnings');
				combineArrays(thisData,thatData,newData,'messages');
				combineArrays(thisData,thatData,newData,'result');
				
				return Vine.api(null,null,newData);
			},

			/**
			 */
			 

			redirect: function(to)
			{
				if(!arguments.length) return data.redirect;
				
				data.redirect = to;
				return this;
			},

			/**
			 */
			 
			message: function(msg)
			{
				if(!arguments.length) return data.message;
				
				data.message = _buildMessage.apply(null, arguments);
				return this;
			},

			/**
			 */

			method: function(method)
			{
				if(!arguments.length) return data.method;
				data.method = method;
				return this;
			},

			/**
			 */

			list: function(data)
			{
				this.result(data);
				return this.method('list');
			},

			/**
			 */

			add: function(data)
			{
				this.result(data);
				return this.method('add');
			},

			/**
			 */

			remove: function(data)
			{
				this.result(data);
				return this.method('remove');
			},

			/**
			 */

			update: function(data)
			{
				this.result(data);
				return this.method('update');
			},

			/**
			 */
			 
			result: function(result)
			{
				if(!arguments.length) return data.result;
				
				data.result = result;
				return this;
			},

			/**
			 */
			 
			results: function(result)
			{
				if(!arguments.length) return data.result;
				
				if(!(data.result instanceof Array)) data.result = [];
				data.result.push(result);
				return this;
			},
			
			/**
			 */
			 
			ttl:function(ttl)
			{
				if(ttl > -1)
					data.ttl = ttl;
					
				return this;
			},


			/**
			 */
			 
			end: function(target)
			{
				if(target)
				if(target.end)
				{
					target.end(data);
				}
				else
				if(typeof target == 'function')
				{
					target(data);
				}
				
				return data;
			},

			/**
			 */

			fn: function(fn)
			{
				if(data.errors) 
				{
					target(data.errors.length > 1 ? data.errors : data.errors[0]);
				}
				else
				{
					fn(null, data.result);
				}	
			},

			/**
			 */

			onOutcome: function(resp, messages) 
			{
				if(messages) {
					messages.resp = resp;
				}

				if(!messages) messages = {};


				return outcome.error(function(err) 
				{
					invoker.error(messages.error || (err ? err.message : err));
						
				}).success(function(result) 
				{
					invoker.result(messages.success || result);

				}).done(function() 
				{
					if(messages.resp) invoker.end(messages.resp);

				});
			},

			/**
			 */
			 
			toJSON: function()
			{
				return invoker.data;
			}
		}
		
		invoker.data = data;


		return invoker;

	}
}

exports.api = Vine.api;

var v = Vine.api();

Object.keys(v).forEach(function(method) {
	exports[method] = function() {
		var api = exports.api();

		return api[method].apply(api, arguments);
	}
})




});

_sardines.register("/modules/vine", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/vine/index.js');
});

_sardines.register("/modules/beanpoll/lib/index.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Router;

  Router = require("./router");

  exports.Messenger = require("./concrete/messenger");

  exports.Director = require("./concrete/director");

  exports.Request = require("./request");

  exports.Response = require("./concrete/response");

  exports.router = function() {
    return new Router();
  };

}).call(this);

});

_sardines.register("/modules/beanpoll", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/beanpoll/lib/index.js');
});

_sardines.register("/modules/crema/lib/index.js", function(require, module, exports, __dirname, __filename) {
	

function parseTokens(route) {
	return route./*route.replace(/\//g,' ').*/replace(/\s+/g,' ').split(' ');
}

function splitOr(tokens, route, routes, start) {

	for(var i = start, n = tokens.length; i < n; i++) {
		var token = tokens[i];

		if(token.toLowerCase() == 'or') {
			var orRoute = route.concat();

			orRoute.pop();

			//skip one token
			orRoute.push(tokens[++i]);

			splitOr(tokens, orRoute, routes, i + 1);

			//this chunk of code will execute if we get a chain of OR statements such as:
			//-method=GET OR -method=POST OR -method=PUT. In which case, we need to skip them.     
			while(i < n - 1 && tokens[i + 1].toLowerCase() == 'or') {
				i += 2;
			}
		} else {
			route.push(token);
		}
	}


	routes.push(route);

	return routes;
}


function parsePath(path) {

	var segments = path instanceof Array ? path : path.replace(/^\/|\/$/g,'').split(/[\s\/]+/g);

	var expr = { value: segments.join('/'), segments: [] };

	for(var i = 0, n = segments.length; i < n; i++) {
		var segment = segments[i],
		isParam = (segment.substr(0,1) == ':');

		expr.segments.push({ value: isParam ? segment.substr(1) : segment, param: isParam });
	}

	return expr;
}

function parseRoutePaths(rootExpr, tokens, start) {

	var n = tokens.length,
	currentExpression = rootExpr;
	currentExpression.path = parsePath(tokens[n - 1]);


	// console.log(start)
	for(var i = n - 2; i >= start; i--) {
		  
		var token = tokens[i], buffer = [];


		if(token == '->') continue;

		//middleware flag - skip  
		

		currentExpression = currentExpression.thru = { path: parsePath(token) };
	}


	return rootExpr;
}

function fixRoute(route, grammar) {
	
	for(var expr in grammar) {
		route = route.replace(grammar[expr], expr);
	}

	return route;
}


function parseRoute(route, grammar) {

	if(grammar) {
		route = fixRoute(route, grammar);
	}

	var tokens = parseTokens(route),
	routes = splitOr(tokens, [], [], 0),
	currentRoute,
	expressions = [];


	for(var i = 0, n = routes.length; i < n; i++) {
		
		var routeTokens = routes[i],
		expr = { tags: {} },
		start = 0;
		
		if(routeTokens[0].match(/^\w+$/) && routeTokens[1] != '->' && routeTokens.length-1)
		{
			start = 1;
			expr.type = routeTokens[0];
		}

		for(var j = start, jn = routeTokens.length; j < jn; j++) {
			
			var routeToken = routeTokens[j];

			//is it a tag?
			if(routeToken.substr(0, 1) == '-') {
				
				var tagParts = routeToken.split('=');

				var tagName = tagParts[0].substr(1);//remove the dash
				
				expr.tags[tagName] = tagParts.length > 1 ? tagParts[1] : true;

				//continue until there are no more tags
				continue;
			} 

			expressions.push(parseRoutePaths(expr, routeTokens, j));
			break;
		}
	}


	return expressions;
}




module.exports = function(source, grammar) {
	return parseRoute(source, grammar);
}


module.exports.grammar = function(grammar) {
	
	return {
		fixRoute: function(source) {
			return fixRoute(source, grammar);
		},
		parse: function(source) {
			return parseRoute(source, grammar);
		}
	}
}


module.exports.parsePath = parsePath;

module.exports.stringifySegments = function(segments, params, ignoreParams) {
	var stringified = [];
	if(!params) params = {};

	for(var i = 0, n = segments.length; i < n; i++) {

		var segment = segments[i], segmentValue;

		if(!ignoreParams && segment.param) {
			segmentValue = params[segment.value] || ':' + segment.value;
		} else {
			segmentValue = segment.value;
		}

		stringified.push(segmentValue);

	}

	return stringified.join('/');
}


module.exports.stringifyTags = function(tags) {
	var stringified = [];

	for(var tagName in tags) {
		var tagValue = tags[tagName];

		if(tagValue === true) {
			stringified.push('-' + tagName);
		} else {
			stringified.push('-' + tagName+'='+tagValue);
		}
	}

	return stringified.join(' ');
}



module.exports.stringify = function(route) {
	
	var stringified = [];
	
	if(route.type) stringified.push(route.type);

	stringified.push(module.exports.stringifyTags(route.tags));
	stringified.push(module.exports.stringifySegments(route.path.segments));
	
	return stringified.join(' ');
}
});

_sardines.register("/modules/crema", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/crema/lib/index.js');
});

_sardines.register("/modules/winston", function(require, module, exports, __dirname, __filename) {
	var loggers = {};




var newLogger = function(module) {

	function logger(name) {
	
		return function(msg) {
			console.log(name + ": " + module + ": " + msg);
		}	
	}

	return {
		info: logger('info'),
		warn: logger('warn'),
		error: logger('error'),
		debug: logger('debug'),
		verbose: logger('verbose')
	};
}


exports.loggers = {
	get: function(name) {
		return loggers[name] || (loggers[name] = newLogger(name))
	}
}

});

_sardines.register("/modules/sprintf/lib/sprintf.js", function(require, module, exports, __dirname, __filename) {
	/**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.11.07 - 0.7-beta1-node
  - converted it to a node.js compatible module

2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};

exports.sprintf = sprintf;
exports.vsprintf = vsprintf;
});

_sardines.register("/modules/sprintf", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/sprintf/lib/sprintf.js');
});

_sardines.register("/modules/events", function(require, module, exports, __dirname, __filename) {
	// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var isArray = Array.isArray;

function EventEmitter() { }
exports.EventEmitter = EventEmitter;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function() {
  var type = arguments[0];
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // If we've already got an array, just append.
    this._events[type].push(listener);

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('.once only takes instances of Function');
  }

  var self = this;
  function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  };

  g.listener = listener;
  self.on(type, g);

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var position = -1;
    for (var i = 0, length = list.length; i < length; i++) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener))
      {
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    list.splice(position, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (list === listener ||
             (list.listener && list.listener === listener))
  {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

_sardines.register("/modules/cashew/lib/index.js", function(require, module, exports, __dirname, __filename) {
	var BinaryParser = require('./binary/parser'),
hash = require('./hash'),
Structr = require('structr');


var MACHINE_ID = parseInt(Math.random() * 0xFFFFFF, 10),
PID = typeof process != 'undefined' ? process.pid : parseInt(Math.random() * 0xFFFFFF, 8);

var numIDsGenerated = 0;

var Generator = Structr({

	/**
	 */

	'__construct': function(key)
	{

		//the key for the generator
		this.key = key;


		//the hash value of the KEY to prepend to the ID / generated hash
		this.keyHash = hash.crc32(key);

	},

	/**
	 */

	'inc': function()
	{
		return numIDsGenerated++;
	},


	/**
	 * a unique identifier, taken from mongodb's spec
	 */

	'uid': function()
	{
		var unixTime  = parseInt(Date.now()/1000, 10),
		time4Bytes    = BinaryParser.encodeInt(unixTime, 32, true, true),
		machine3Bytes = BinaryParser.encodeInt(MACHINE_ID, 24, false),
		pid2Bytes     = BinaryParser.fromShort(PID),
		index3Bytes   = BinaryParser.encodeInt(this.inc(), 24, false, true);

		return this.keyHash + this._toHexString(time4Bytes + machine3Bytes + pid2Bytes + index3Bytes);	
	},

	/**
	 * hashed 
	 */

	'hash': function(value, algorithm)
	{
		//crc32 or md5 for now...
		return this.keyHash + hash[algorithm || 'md5'](value);
	},


	/**
	 */

	'random': function()
	{
		var buffer = '', n = 32; //size of md5 hash
		for(var i = n; i--;) buffer += this._rc();

		return this.hash(buffer);
	},

	/**
	 */

	'_rc': function(id)
	{
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	},

	/**
	 */
	 
	'_toHexString': function(id)
	{
		var hexString = '', number, value;

		for (var index = 0, len = id.length; index < len; index++) 
		{
			value = BinaryParser.toByte(id.substr(index, 1));

			number = value <= 15 ? '0' + value.toString(16) : value.toString(16);

		    hexString = hexString + number;
		}

		return hexString;
	}
});

var Manager = Structr({
    
    /**
     */
     
    '__construct': function()
    {
    	this._generatorsByKey = {};

    	//crc32 hash for the key
    	this._generatorsByHash = {};

    	//the number of IDS generated
    	this.idsGenerated = 0;
    },
    
    /**
     */
     
    'register': function(key, clazz)
    {
    	if(this._generatorsByKey[key]) return this._generatorsByKey[key];

    	if(!clazz) clazz = Generator;

    	var gen = new clazz(key);

    	return this._generatorsByHash[gen.keyHash] = this._generatorsByKey[key] = gen;
    },

    /**
     */

    'generator': function(keyOrId, create)
    {
    	return this._generatorsByKey[keyOrId] || this._generatorsByHash[keyOrId.substr(0, 8)] || (create ? new Generator(keyOrId) : null);
    },

    /**
     */

    'key': function(keyOrId)
    {
    	var gen = this.generator(keyOrId);

    	return gen ? gen.key : null; 
    }
     
});

var glob = typeof window != 'undefined' ? window : global;


//forces NPM to return the global verson
var man = glob.cashew ? glob.cashew : new Manager();
man.Generator = Generator;

module.exports = glob.cashew = man;




});

_sardines.register("/modules/cashew", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/cashew/lib/index.js');
});

_sardines.register("/modules/beanpoll/lib/router.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var RequestBuilder, Router, collectPlugin, crema, disposable, plugins, pullPlugin, pushPlugin, _;

  crema = require("crema");

  RequestBuilder = require("./request").Builder;

  pushPlugin = require("./push/plugin");

  pullPlugin = require("./pull/plugin");

  collectPlugin = require("./collect/plugin");

  plugins = require("./plugins");

  disposable = require("disposable");

  _ = require("underscore");

  Router = (function() {
    /*
    */
    function Router() {
      this.directors = {};
      this.parse = crema;
      this._requestBuilder = new RequestBuilder(this);
      this._plugins = new plugins(this);
      this.use(pushPlugin);
      this.use(pullPlugin);
      this.use(collectPlugin);
    }

    /*
    	 uses a dispatcher
    */

    Router.prototype.use = function(plugin) {
      return this._plugins.add(plugin);
    };

    /*
    */

    Router.prototype.using = function() {
      return this._plugins.using();
    };

    /*
    	 listens for a request
    */

    Router.prototype.on = function(routeOrListeners, ops, callback) {
      var listenerDisposables, route, routes, type, _fn, _i, _len,
        _this = this;
      if (!callback) {
        callback = ops;
        ops = {};
      }
      listenerDisposables = disposable.create();
      if (typeof routeOrListeners === "object" && !callback) {
        for (type in routeOrListeners) {
          listenerDisposables.add(this.on(type, routeOrListeners[type]));
        }
        return listenerDisposables;
      }
      if (typeof routeOrListeners === "string") {
        routes = crema(routeOrListeners);
      } else if (routeOrListeners instanceof Array) {
        routes = routeOrListeners;
      } else {
        routes = [routeOrListeners];
      }
      _fn = function(route) {
        if (ops.type) route.type = ops.type;
        if (ops.tags) _.extend(route.tags, ops.tags);
        listenerDisposables.add(_this.director(route.type).addListener(route, callback));
        return _this._plugins.newListener({
          route: route,
          callback: callback
        });
      };
      for (_i = 0, _len = routes.length; _i < _len; _i++) {
        route = routes[_i];
        _fn(route);
      }
      return listenerDisposables;
    };

    /*
    	 returns the given director, or throws an error if it doesn't exist
    */

    Router.prototype.director = function(type) {
      var director;
      director = this.directors[type];
      if (!director) throw new Error("director " + type + " does not exist");
      return director;
    };

    /*
    */

    Router.prototype.paths = function(ops) {
      var director, name, paths;
      paths = [];
      for (name in this.directors) {
        director = this.directors[name];
        paths = paths.concat(director.paths(ops));
      }
      return paths;
    };

    Router.prototype.dispatch = function(requestWriter) {
      return this.director(requestWriter.type).dispatch(requestWriter);
    };

    /*
    	 abreviated
    */

    Router.prototype.req = function() {
      return this.request.apply(this, arguments);
    };

    /*
    	 Initializes a new request
    */

    Router.prototype.request = function(path, query, headers) {
      return this._requestBuilder.clean().path(typeof path === "string" ? crema.parsePath(path) : path).query(query).headers(headers);
    };

    return Router;

  })();

  module.exports = Router;

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/concrete/messenger.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var LinkedQueue, Response, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  LinkedQueue = require("../collections/linkedQueue");

  Response = require("./response");

  _ = require("underscore");

  module.exports = (function(_super) {

    __extends(_Class, _super);

    /*
    	 constructor
    */

    function _Class(request, first, director) {
      var _this = this;
      this.request = request;
      this.first = first;
      this.director = director;
      this.request = this.request;
      this.router = director.router;
      this.from = request.from;
      _Class.__super__.constructor.call(this, first);
      this.response = new Response(this);
      this.response.reader().dump(function() {
        return _this.request.callback.apply(_this.request, arguments);
      }, this.request.headers);
    }

    /*
    */

    _Class.prototype.start = function() {
      return this.next();
    };

    /*
    */

    _Class.prototype.data = function(name) {
      var obj, _i, _len;
      if (arguments.length === 0) {
        return _.extend({}, this.request.sanitized, this.current.params, this.request.query);
      } else if (arguments.length > 1) {
        obj = {};
        for (_i = 0, _len = arguments.length; _i < _len; _i++) {
          name = arguments[_i];
          obj[name] = this.data(name);
        }
        obj;
      }
      return this.request.sanitized[name] || this.current.params[name] || (this.request.query ? this.request.query[name] : null);
    };

    /*
    	 flattens all param data into one object
    */

    _Class.prototype.flattenData = function(reset) {
      var allData, cur;
      if (this._allData && !reset) return this._allData;
      cur = this.current;
      allData = _.defaults(cur.params, this.request.query);
      cur = cur.getNextSibling();
      while (cur) {
        _.defaults(allData, cur.params);
        cur = cur.getNextSibling();
      }
      return this._allData = allData;
    };

    /*
    */

    _Class.prototype._onNext = function(middleware, args) {
      if (args && args.length) {
        if (args[0]) {
          return _onError(args[0]);
        } else {
          _onNextData(args[1]);
        }
      }
      this.request.params = middleware.params;
      try {
        this.request.cache(this.hasNext);
        return this._next(middleware, args);
      } catch (e) {
        return this.response.error(e);
      }
    };

    /*
    */

    _Class.prototype._next = function(middleware) {
      return middleware.listener(this);
    };

    /*
    */

    _Class.prototype._onError = function(error) {};

    /*
    */

    _Class.prototype._onNextData = function() {};

    return _Class;

  })(LinkedQueue);

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/concrete/director.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Messenger, RequestMiddleware, crema, dolce;

  dolce = require("dolce");

  RequestMiddleware = require("./middleware");

  crema = require("crema");

  Messenger = require("./messenger");

  /*
  
  Director process:
  */

  module.exports = (function() {
    /*
    	 some directors are passive, meaning errors aren't returned if a route does not exist. This goes for collectors,
    	 emitters, etc.
    */
    _Class.prototype.passive = false;

    /*
    	 constructor
    */

    function _Class(name, router) {
      this.name = name;
      this.router = router;
      this._collection = dolce.collection();
    }

    /*
    	 returns number of listeners based on path given
    */

    _Class.prototype.numListeners = function(path, ops) {
      return this._collection.get(path, ops).chains.length;
    };

    /*
    	 dispatches a request
    */

    _Class.prototype.dispatch = function(requestWriter) {
      var chain, chains, messanger, middleware, numChains, numRunning, oldAck, requestReader, _i, _len;
      try {
        chains = this.getListeners(requestWriter, void 0, !this.passive);
      } catch (e) {
        return requestWriter.callback(new Error("" + this.name + " " + e.message));
      }
      numChains = chains.length;
      numRunning = numChains;
      oldAck = requestWriter.callback;
      requestWriter.running = !!numChains;
      requestWriter.callback = function() {
        requestWriter.running = !!(--numRunning);
        if (oldAck) {
          return oldAck.apply(this, Array.apply(null, arguments).concat([numRunning, numChains]));
        }
      };
      if (!!!chains.length && !this.passive) {
        requestWriter.callback(new Error("" + this.name + " route \"" + (crema.stringifySegments(requestWriter.path.segments)) + "\" does not exist"));
        return this;
      }
      for (_i = 0, _len = chains.length; _i < _len; _i++) {
        chain = chains[_i];
        requestReader = requestWriter.reader();
        middleware = RequestMiddleware.wrap(chain, requestWriter.pre, requestWriter.next, this);
        messanger = this._newMessenger(requestReader, middleware);
        messanger.start();
      }
      return this;
    };

    /*
    	 adds a route listener to the collection tree
    */

    _Class.prototype.addListener = function(route, callback) {
      disposable;
      var disposable, oldCallback;
      if (route.tags.one) {
        oldCallback = callback;
        callback = function() {
          oldCallback.apply(this, arguments);
          return disposable.dispose();
        };
      }
      this._validateListener(route, callback);
      return disposable = this._collection.add(route, callback);
    };

    /*
    */

    _Class.prototype.removeListeners = function(route) {
      return this._collection.remove(route.path, {
        tags: route.tags
      });
    };

    /*
    */

    _Class.prototype.paths = function(ops) {
      var listener, _i, _len, _ref, _results;
      _ref = this._collection.find(ops);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        _results.push({
          tags: listener.tags,
          type: this.name,
          value: listener.path,
          segments: listener.segments
        });
      }
      return _results;
    };

    /*
    */

    _Class.prototype.listenerQuery = function(ops) {
      var filter, key, tag;
      filter = [];
      for (key in ops.filter) {
        tag = {};
        tag[key] = ops.filter[key];
        filter.push(tag);
      }
      return {
        $or: [
          {
            $and: filter
          }, {
            unfilterable: {
              $exists: true
            }
          }
        ]
      };
    };

    /*
    */

    _Class.prototype.getListeners = function(request, expand, throwError) {
      return this._collection.get(request.path, {
        siftTags: this.listenerQuery(request),
        expand: expand,
        throwErrors: throwError
      }).chains;
    };

    /*
    	 returns a new request
    */

    _Class.prototype._newMessenger = function(request, middleware) {
      return new Messenger(request, middleware, this);
    };

    /*
    */

    _Class.prototype._validateListener = function(route) {
      var listeners;
      if (this.passive) return;
      listeners = this._collection.get(route.path, {
        tags: route.tags,
        expand: false
      });
      if (!!listeners.length) {
        throw new Error("Route \"" + route.path.value + "\" already exists");
      }
    };

    return _Class;

  })();

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/request.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Reader, RequestReader, RequestWriter, Writer, outcome,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Reader = require("./io/reader");

  Writer = require("./io/writer");

  outcome = require("outcome");

  exports.Reader = RequestReader = (function(_super) {

    __extends(RequestReader, _super);

    /*
    	 constructor
    */

    function RequestReader(writer, from, path, query, sanitized, headers, filter, callback) {
      this.writer = writer;
      this.from = from;
      this.path = path;
      this.query = query;
      this.sanitized = sanitized != null ? sanitized : {};
      this.headers = headers != null ? headers : {};
      this.filter = filter != null ? filter : {};
      this.callback = callback != null ? callback : null;
      RequestReader.__super__.constructor.call(this, writer);
    }

    return RequestReader;

  })(Reader);

  exports.Writer = RequestWriter = (function(_super) {

    __extends(RequestWriter, _super);

    /*
    */

    function RequestWriter(_ops) {
      this._ops = _ops;
      this.next = _ops.next;
      this.pre = _ops.pre;
      this.path = _ops.path;
      this.type = _ops.type;
      this.from = _ops.from;
      this.query = _ops.query;
      this.filter = _ops.filter || {};
      this.headers = _ops.headers;
      this.callback = _ops.callback;
      this.sanitized = _ops.sanitized;
      RequestWriter.__super__.constructor.call(this);
    }

    /*
    */

    RequestWriter.prototype.reader = function() {
      return new RequestReader(this, this.from, this.path, this.query, this.sanitized, this.headers, this.filter, this.callback);
    };

    return RequestWriter;

  })(Writer);

  exports.Builder = (function() {
    /*
    */
    function _Class(router) {
      this.router = router;
      this.clean();
    }

    /*
    	 options which control how the request
    	 is handled. This can fill out the entire request vs using the methods given
    */

    _Class.prototype.options = function(value) {
      if (!arguments.length) return this._ops;
      this._ops = value || {};
      return this;
    };

    /*
    */

    _Class.prototype.clean = function() {
      this._ops = {};
      return this.from(this.router);
    };

    /*
    	 filterable tags
    */

    _Class.prototype.tag = function(keyOrTags, value) {
      return this._objParam('filter', arguments, function(value) {
        if (typeof value === 'boolean') {
          return {
            $exists: value
          };
        }
        return value;
      });
    };

    /*
    	 DEPRECATED
    */

    _Class.prototype.headers = function(value) {
      return this.header(value);
    };

    /*
    	 The header data explaining the request, such as tags, content type, etc.
    */

    _Class.prototype.header = function(keyOrHeaders, value) {
      return this._objParam('headers', arguments);
    };

    /*
    */

    _Class.prototype.type = function(value) {
      return this._param('type', arguments);
    };

    /*
    */

    _Class.prototype.from = function(value) {
      return this._param('from', arguments);
    };

    /*
    */

    _Class.prototype.to = function(value) {
      return this._param('to', arguments);
    };

    /*
    */

    _Class.prototype.path = function(value) {
      return this._param('path', arguments);
    };

    /* 
    	 Query would be something like ?name=craig&last=condon
    */

    _Class.prototype.query = function(value) {
      return this._param('query', arguments);
    };

    /* 
    	 data that has been cleaned up after validation
    */

    _Class.prototype.sanitized = function(value) {
      return this._param('sanitized', arguments);
    };

    /*
    	 response handler, or ack
    	 deprecated
    */

    _Class.prototype.response = function(callback) {
      return this._param('response', arguments);
    };

    /*
    	 on error callback
    */

    _Class.prototype.error = function(callback) {
      return this._param('error', arguments);
    };

    /*
    	 on success callback
    */

    _Class.prototype.success = function(callback) {
      return this._param('success', arguments);
    };

    /*
    	 append middleware to the end
    */

    _Class.prototype.next = function(middleware) {
      return this._param('next', arguments);
    };

    /*
    	 prepend middleware
    */

    _Class.prototype.pre = function(middleware) {
      return this._param('pre', arguments);
    };

    /*
    */

    _Class.prototype.dispatch = function(type) {
      var writer;
      this._ops.callback = outcome({
        error: this.error(),
        success: this.success(),
        callback: this.response()
      });
      if (type) this.type(type);
      writer = new RequestWriter(this._ops);
      this.router.dispatch(writer);
      return writer;
    };

    /*
    	 DEPRECATED
    */

    _Class.prototype.hasListeners = function() {
      return this.exists();
    };

    /*
    */

    _Class.prototype.exists = function() {
      return !!this.listeners().length;
    };

    /*
    */

    _Class.prototype.listeners = function() {
      return this.router.director(this.type()).getListeners({
        path: this._ops.path,
        filter: this._ops.filter
      }, false);
    };

    /*
    */

    _Class.prototype._param = function(name, args) {
      if (!args.length) return this._ops[name];
      this._ops[name] = args[0];
      return this;
    };

    /*
    */

    _Class.prototype._objParam = function(name, args, getValue) {
      var key, keyOrObj, value;
      if (!args.length) return this._ops[name];
      if (!this._ops[name]) this._ops[name] = {};
      keyOrObj = args[0];
      value = args[1];
      if (typeof keyOrObj === 'string') {
        if (args.length === 1) return this._ops.headers[keyOrObj];
        this._ops[name][keyOrObj] = getValue ? getValue(value) : value;
      } else {
        for (key in keyOrObj) {
          this._objParam(name, [key, keyOrObj[key]], getValue);
        }
      }
      return this;
    };

    return _Class;

  })();

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/concrete/response.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Reader, Response, ResponseReader, Writer, outcome, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Writer = require("../io/writer");

  Reader = require("../io/reader");

  _ = require("underscore");

  outcome = require("outcome");

  ResponseReader = (function(_super) {

    __extends(ResponseReader, _super);

    function ResponseReader() {
      ResponseReader.__super__.constructor.apply(this, arguments);
    }

    /*
    */

    ResponseReader.prototype._listenTo = function() {
      return ResponseReader.__super__._listenTo.call(this).concat("headers");
    };

    /*
    */

    ResponseReader.prototype._listen = function() {
      var _this = this;
      ResponseReader.__super__._listen.call(this);
      return this.on("headers", function(headers) {
        return _this.headers = headers;
      });
    };

    ResponseReader.prototype._dumpCached = function(pipedReader) {
      if (this.headers) pipedReader.emit("headers", this.headers);
      return ResponseReader.__super__._dumpCached.call(this, pipedReader);
    };

    return ResponseReader;

  })(Reader);

  module.exports = Response = (function(_super) {

    __extends(Response, _super);

    /*
    */

    function Response(messenger) {
      var _this = this;
      this.messenger = messenger;
      Response.__super__.constructor.call(this);
      this._headers = {};
      this.once("data", function() {
        return _this.sendHeaders();
      });
      this.once("end", function() {
        return _this.sendHeaders();
      });
    }

    /*
    */

    Response.prototype.header = function(typeOrObj, value) {
      if (typeof typeOrObj === "object") {
        _.extend(this._headers, typeOrObj);
      } else {
        this._headers[typeOrObj] = value;
      }
      return this;
    };

    /*
    	 DEPRECATED
    */

    Response.prototype.headers = function(typeOrObj, value) {
      return this.header(typeOrObj, value);
    };

    /*
    */

    /*
    */

    /*
    	 wrap-around for error handling
    */

    Response.prototype.success = function(success) {
      var _this = this;
      if (!this._outcome) {
        this._outcome = outcome.error(function(err) {
          return _this.error(err);
        });
      }
      return this._outcome.success(success);
    };

    /*
    */

    Response.prototype.sendHeaders = function() {
      if (this.sentHeaders) return this;
      this.sentHeaders = true;
      this.emit("headers", this._headers);
      return this;
    };

    /*
    */

    Response.prototype.reader = function() {
      return new ResponseReader(this);
    };

    return Response;

  })(Writer);

  Writer.prototype.writable = true;

}).call(this);

});

_sardines.register("/modules/outcome/lib/index.js", function(require, module, exports, __dirname, __filename) {
	var EventEmitter = require('events').EventEmitter,

//used for dispatching unhandledError messages
globalEmitter = new EventEmitter();


var Chain = function(listeners) {

	if(!listeners) listeners = { };


	var fn = function() {

		var args = Array.apply(null, arguments), orgArgs = arguments;

		if(listeners.callback) {

			listeners.callback.apply(this, args);

		}

		if(listeners.handle) {
			
			listeners.handle.apply(listeners, args);

		} else {

			//error should always be first args
			err = args.shift();

			//on error
			if(err) {

				listeners.error.call(this, err);

			} else
			if(listeners.success) {
				
				listeners.success.apply(this, args);

			}

		}	
		
	};

	fn.listeners = listeners;

	//DEPRECATED
	fn.done = function(fn) {

		return fn.callback(fn);

	}

	fn.handle = function(value) {

		return _copy({ handle: value });
		
	}

	fn.callback = function(value) {
		
		return _copy({ callback: value });

	}

	fn.success = function(value) {
			
		return _copy({ success: value });

	}

	fn.error = function(value) {

		return _copy({ error: value });

	}


	//error does not exist? set the default which throws one
	if(!listeners.error) {

		listeners.error = function(err) {

			//no error callback? check of unhandled error is present, or throw
			if(!globalEmitter.emit('unhandledError', err) && !listeners.callback) throw err;

		}

	}


		
	function _copy(childListeners) {

		//copy these listeners to a new chain
		for(var type in listeners) {
			
			if(childListeners[type]) continue;

			childListeners[type] = listeners[type];

		}

		return Chain(childListeners);

	}

	return fn;
}


module.exports = function(listeners) {

	return Chain(listeners);

}

//bleh this could be better. Need to copy the chain functions to the module.exports var
var chain = Chain();

//copy the obj keys to module.exports
Object.keys(chain).forEach(function(prop) {
	
	//on call of error, success, callback - make a new chain
	module.exports[prop] = function() {
		
		var child = Chain();

		return child[prop].apply(child, arguments);
	}
});


//running online?
if(typeof window != 'undefined') {
	
	window.outcome = module.exports;

}





});

_sardines.register("/modules/outcome", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/outcome/lib/index.js');
});

_sardines.register("/modules/cashew/lib/binary/parser.js", function(require, module, exports, __dirname, __filename) {
	

/**
 * Binary Parser.
 * Jonas Raoni Soares Silva
 * http://jsfromhell.com/classes/binary-parser [v1.0]
 */

var chr = String.fromCharCode;

var maxBits = [];
for (var i = 0; i < 64; i++) {
  maxBits[i] = Math.pow(2, i);
}

function BinaryParser (bigEndian, allowExceptions) {
  this.bigEndian = bigEndian;
  this.allowExceptions = allowExceptions;
};

BinaryParser.warn = function warn (msg) {
  if (this.allowExceptions) {
    throw new Error(msg);
  }

  return 1;
};

BinaryParser.decodeFloat = function decodeFloat (data, precisionBits, exponentBits) {
  var b = new this.Buffer(this.bigEndian, data);

  b.checkBuffer(precisionBits + exponentBits + 1);

  var bias = maxBits[exponentBits - 1] - 1
    , signal = b.readBits(precisionBits + exponentBits, 1)
    , exponent = b.readBits(precisionBits, exponentBits)
    , significand = 0
    , divisor = 2
    , curByte = b.buffer.length + (-precisionBits >> 3) - 1;

  do {
    for (var byteValue = b.buffer[ ++curByte ], startBit = precisionBits % 8 || 8, mask = 1 << startBit; mask >>= 1; ( byteValue & mask ) && ( significand += 1 / divisor ), divisor *= 2 );
  } while (precisionBits -= startBit);

  return exponent == ( bias << 1 ) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity : ( 1 + signal * -2 ) * ( exponent || significand ? !exponent ? Math.pow( 2, -bias + 1 ) * significand : Math.pow( 2, exponent - bias ) * ( 1 + significand ) : 0 );
};

BinaryParser.decodeInt = function decodeInt (data, bits, signed, forceBigEndian) {
  var b = new this.Buffer(this.bigEndian || forceBigEndian, data)
      , x = b.readBits(0, bits)
      , max = maxBits[bits]; //max = Math.pow( 2, bits );
  
  return signed && x >= max / 2
      ? x - max
      : x;
};

BinaryParser.encodeFloat = function encodeFloat (data, precisionBits, exponentBits) {
  var bias = maxBits[exponentBits - 1] - 1
    , minExp = -bias + 1
    , maxExp = bias
    , minUnnormExp = minExp - precisionBits
    , n = parseFloat(data)
    , status = isNaN(n) || n == -Infinity || n == +Infinity ? n : 0
    , exp = 0
    , len = 2 * bias + 1 + precisionBits + 3
    , bin = new Array(len)
    , signal = (n = status !== 0 ? 0 : n) < 0
    , intPart = Math.floor(n = Math.abs(n))
    , floatPart = n - intPart
    , lastBit
    , rounded
    , result
    , i
    , j;

  for (i = len; i; bin[--i] = 0);

  for (i = bias + 2; intPart && i; bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2));

  for (i = bias + 1; floatPart > 0 && i; (bin[++i] = ((floatPart *= 2) >= 1) - 0 ) && --floatPart);

  for (i = -1; ++i < len && !bin[i];);

  if (bin[(lastBit = precisionBits - 1 + (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp ? i + 1 : bias + 1 - (exp = minExp - 1))) + 1]) {
    if (!(rounded = bin[lastBit])) {
      for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]);
    }

    for (j = lastBit + 1; rounded && --j >= 0; (bin[j] = !bin[j] - 0) && (rounded = 0));
  }

  for (i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];);

  if ((exp = bias + 1 - i) >= minExp && exp <= maxExp) {
    ++i;
  } else if (exp < minExp) {
    exp != bias + 1 - len && exp < minUnnormExp && this.warn("encodeFloat::float underflow");
    i = bias + 1 - (exp = minExp - 1);
  }

  if (intPart || status !== 0) {
    this.warn(intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status);
    exp = maxExp + 1;
    i = bias + 2;

    if (status == -Infinity) {
      signal = 1;
    } else if (isNaN(status)) {
      bin[i] = 1;
    }
  }

  for (n = Math.abs(exp + bias), j = exponentBits + 1, result = ""; --j; result = (n % 2) + result, n = n >>= 1);

  for (n = 0, j = 0, i = (result = (signal ? "1" : "0") + result + bin.slice(i, i + precisionBits).join("")).length, r = []; i; j = (j + 1) % 8) {
    n += (1 << j) * result.charAt(--i);
    if (j == 7) {
      r[r.length] = String.fromCharCode(n);
      n = 0;
    }
  }

  r[r.length] = n
    ? String.fromCharCode(n)
    : "";

  return (this.bigEndian ? r.reverse() : r).join("");
};

BinaryParser.encodeInt = function encodeInt (data, bits, signed, forceBigEndian) {
  var max = maxBits[bits];

  if (data >= max || data < -(max / 2)) {
    this.warn("encodeInt::overflow");
    data = 0;
  }

  if (data < 0) {
    data += max;
  }

  for (var r = []; data; r[r.length] = String.fromCharCode(data % 256), data = Math.floor(data / 256));

  for (bits = -(-bits >> 3) - r.length; bits--; r[r.length] = "\0");

  return ((this.bigEndian || forceBigEndian) ? r.reverse() : r).join("");
};

BinaryParser.toSmall    = function( data ){ return this.decodeInt( data,  8, true  ); };
BinaryParser.fromSmall  = function( data ){ return this.encodeInt( data,  8, true  ); };
BinaryParser.toByte     = function( data ){ return this.decodeInt( data,  8, false ); };
BinaryParser.fromByte   = function( data ){ return this.encodeInt( data,  8, false ); };
BinaryParser.toShort    = function( data ){ return this.decodeInt( data, 16, true  ); };
BinaryParser.fromShort  = function( data ){ return this.encodeInt( data, 16, true  ); };
BinaryParser.toWord     = function( data ){ return this.decodeInt( data, 16, false ); };
BinaryParser.fromWord   = function( data ){ return this.encodeInt( data, 16, false ); };
BinaryParser.toInt      = function( data ){ return this.decodeInt( data, 32, true  ); };
BinaryParser.fromInt    = function( data ){ return this.encodeInt( data, 32, true  ); };
BinaryParser.toLong     = function( data ){ return this.decodeInt( data, 64, true  ); };
BinaryParser.fromLong   = function( data ){ return this.encodeInt( data, 64, true  ); };
BinaryParser.toDWord    = function( data ){ return this.decodeInt( data, 32, false ); };
BinaryParser.fromDWord  = function( data ){ return this.encodeInt( data, 32, false ); };
BinaryParser.toQWord    = function( data ){ return this.decodeInt( data, 64, true ); };
BinaryParser.fromQWord  = function( data ){ return this.encodeInt( data, 64, true ); };
BinaryParser.toFloat    = function( data ){ return this.decodeFloat( data, 23, 8   ); };
BinaryParser.fromFloat  = function( data ){ return this.encodeFloat( data, 23, 8   ); };
BinaryParser.toDouble   = function( data ){ return this.decodeFloat( data, 52, 11  ); };
BinaryParser.fromDouble = function( data ){ return this.encodeFloat( data, 52, 11  ); };

// Factor out the encode so it can be shared by add_header and push_int32
BinaryParser.encode_int32 = function encode_int32 (number) {
  var a, b, c, d, unsigned;
  unsigned = (number < 0) ? (number + 0x100000000) : number;
  a = Math.floor(unsigned / 0xffffff);
  unsigned &= 0xffffff;
  b = Math.floor(unsigned / 0xffff);
  unsigned &= 0xffff;
  c = Math.floor(unsigned / 0xff);
  unsigned &= 0xff;
  d = Math.floor(unsigned);
  return chr(a) + chr(b) + chr(c) + chr(d);
};

BinaryParser.encode_int64 = function encode_int64 (number) {
  var a, b, c, d, e, f, g, h, unsigned;
  unsigned = (number < 0) ? (number + 0x10000000000000000) : number;
  a = Math.floor(unsigned / 0xffffffffffffff);
  unsigned &= 0xffffffffffffff;
  b = Math.floor(unsigned / 0xffffffffffff);
  unsigned &= 0xffffffffffff;
  c = Math.floor(unsigned / 0xffffffffff);
  unsigned &= 0xffffffffff;
  d = Math.floor(unsigned / 0xffffffff);
  unsigned &= 0xffffffff;
  e = Math.floor(unsigned / 0xffffff);
  unsigned &= 0xffffff;
  f = Math.floor(unsigned / 0xffff);
  unsigned &= 0xffff;
  g = Math.floor(unsigned / 0xff);
  unsigned &= 0xff;
  h = Math.floor(unsigned);
  return chr(a) + chr(b) + chr(c) + chr(d) + chr(e) + chr(f) + chr(g) + chr(h);
};

/**
 * UTF8 methods
 */

// Take a raw binary string and return a utf8 string
BinaryParser.decode_utf8 = function decode_utf8 (binaryStr) {
  var len = binaryStr.length
    , decoded = ''
    , i = 0
    , c = 0
    , c1 = 0
    , c2 = 0
    , c3;

  while (i < len) {
    c = binaryStr.charCodeAt(i);
    if (c < 128) {
      decoded += String.fromCharCode(c);
      i++;
    } else if ((c > 191) && (c < 224)) {
      c2 = binaryStr.charCodeAt(i+1);
      decoded += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
      i += 2;
    } else {
      c2 = binaryStr.charCodeAt(i+1);
      c3 = binaryStr.charCodeAt(i+2);
      decoded += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      i += 3;
    }
  }

  return decoded;
};

// Encode a cstring
BinaryParser.encode_cstring = function encode_cstring (s) {
  return unescape(encodeURIComponent(s)) + BinaryParser.fromByte(0);
};

// Take a utf8 string and return a binary string
BinaryParser.encode_utf8 = function encode_utf8 (s) {
  var a = ""
    , c;

  for (var n = 0, len = s.length; n < len; n++) {
    c = s.charCodeAt(n);

    if (c < 128) {
      a += String.fromCharCode(c);
    } else if ((c > 127) && (c < 2048)) {
      a += String.fromCharCode((c>>6) | 192) ;
      a += String.fromCharCode((c&63) | 128);
    } else {
      a += String.fromCharCode((c>>12) | 224);
      a += String.fromCharCode(((c>>6) & 63) | 128);
      a += String.fromCharCode((c&63) | 128);
    }
  }

  return a;
};

BinaryParser.hprint = function hprint (s) {
  var number;

  for (var i = 0, len = s.length; i < len; i++) {
    if (s.charCodeAt(i) < 32) {
      number = s.charCodeAt(i) <= 15
        ? "0" + s.charCodeAt(i).toString(16)
        : s.charCodeAt(i).toString(16);        
      process.stdout.write(number + " ")
    } else {
      number = s.charCodeAt(i) <= 15
        ? "0" + s.charCodeAt(i).toString(16)
        : s.charCodeAt(i).toString(16);
        process.stdout.write(number + " ")
    }
  }
  
  process.stdout.write("\n\n");
};

BinaryParser.ilprint = function hprint (s) {
  var number;

  for (var i = 0, len = s.length; i < len; i++) {
    if (s.charCodeAt(i) < 32) {
      number = s.charCodeAt(i) <= 15
        ? "0" + s.charCodeAt(i).toString(10)
        : s.charCodeAt(i).toString(10);

    } else {
      number = s.charCodeAt(i) <= 15
        ? "0" + s.charCodeAt(i).toString(10)
        : s.charCodeAt(i).toString(10);
        
    }
  }
};

BinaryParser.hlprint = function hprint (s) {
  var number;

  for (var i = 0, len = s.length; i < len; i++) {
    if (s.charCodeAt(i) < 32) {
      number = s.charCodeAt(i) <= 15
        ? "0" + s.charCodeAt(i).toString(16)
        : s.charCodeAt(i).toString(16);

    } else {
      number = s.charCodeAt(i) <= 15
        ? "0" + s.charCodeAt(i).toString(16)
        : s.charCodeAt(i).toString(16);

    }
  }
};

/**
 * BinaryParser buffer constructor.
 */

function BinaryParserBuffer (bigEndian, buffer) {
  this.bigEndian = bigEndian || 0;
  this.buffer = [];
  this.setBuffer(buffer);
};

BinaryParserBuffer.prototype.setBuffer = function setBuffer (data) {
  var l, i, b;

  if (data) {
    i = l = data.length;
    b = this.buffer = new Array(l);
    for (; i; b[l - i] = data.charCodeAt(--i));
    this.bigEndian && b.reverse();
  }
};

BinaryParserBuffer.prototype.hasNeededBits = function hasNeededBits (neededBits) {
  return this.buffer.length >= -(-neededBits >> 3);
};

BinaryParserBuffer.prototype.checkBuffer = function checkBuffer (neededBits) {
  if (!this.hasNeededBits(neededBits)) {
    throw new Error("checkBuffer::missing bytes");
  }
};

BinaryParserBuffer.prototype.readBits = function readBits (start, length) {
  //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)

  function shl (a, b) {
    for (; b--; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
    return a;
  }

  if (start < 0 || length <= 0) {
    return 0;
  }

  this.checkBuffer(start + length);

  var offsetLeft
    , offsetRight = start % 8
    , curByte = this.buffer.length - ( start >> 3 ) - 1
    , lastByte = this.buffer.length + ( -( start + length ) >> 3 )
    , diff = curByte - lastByte
    , sum = ((this.buffer[ curByte ] >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1)) + (diff && (offsetLeft = (start + length) % 8) ? (this.buffer[lastByte++] & ((1 << offsetLeft) - 1)) << (diff-- << 3) - offsetRight : 0);

  for(; diff; sum += shl(this.buffer[lastByte++], (diff-- << 3) - offsetRight));

  return sum;
};

/**
 * Expose.
 */

module.exports = BinaryParser;
BinaryParser.Buffer = BinaryParserBuffer;
});

_sardines.register("/modules/cashew/lib/hash/index.js", function(require, module, exports, __dirname, __filename) {
	
exports.md5 = function (string) {

   function RotateLeft(lValue, iShiftBits) {
           return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
   }

   function AddUnsigned(lX,lY) {
           var lX4,lY4,lX8,lY8,lResult;
           lX8 = (lX & 0x80000000);
           lY8 = (lY & 0x80000000);
           lX4 = (lX & 0x40000000);
           lY4 = (lY & 0x40000000);
           lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
           if (lX4 & lY4) {
                   return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
           }
           if (lX4 | lY4) {
                   if (lResult & 0x40000000) {
                           return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                   } else {
                           return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                   }
           } else {
                   return (lResult ^ lX8 ^ lY8);
           }
   }

   function F(x,y,z) { return (x & y) | ((~x) & z); }
   function G(x,y,z) { return (x & z) | (y & (~z)); }
   function H(x,y,z) { return (x ^ y ^ z); }
   function I(x,y,z) { return (y ^ (x | (~z))); }

   function FF(a,b,c,d,x,s,ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
   };

   function GG(a,b,c,d,x,s,ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
   };

   function HH(a,b,c,d,x,s,ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
   };

   function II(a,b,c,d,x,s,ac) {
           a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
           return AddUnsigned(RotateLeft(a, s), b);
   };

   function ConvertToWordArray(string) {
           var lWordCount;
           var lMessageLength = string.length;
           var lNumberOfWords_temp1=lMessageLength + 8;
           var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
           var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
           var lWordArray=Array(lNumberOfWords-1);
           var lBytePosition = 0;
           var lByteCount = 0;
           while ( lByteCount < lMessageLength ) {
                   lWordCount = (lByteCount-(lByteCount % 4))/4;
                   lBytePosition = (lByteCount % 4)*8;
                   lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
                   lByteCount++;
           }
           lWordCount = (lByteCount-(lByteCount % 4))/4;
           lBytePosition = (lByteCount % 4)*8;
           lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
           lWordArray[lNumberOfWords-2] = lMessageLength<<3;
           lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
           return lWordArray;
   };

   function WordToHex(lValue) {
           var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
           for (lCount = 0;lCount<=3;lCount++) {
                   lByte = (lValue>>>(lCount*8)) & 255;
                   WordToHexValue_temp = "0" + lByte.toString(16);
                   WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
           }
           return WordToHexValue;
   };

   function Utf8Encode(string) {
           string = string.replace(/\r\n/g,"\n");
           var utftext = "";

           for (var n = 0; n < string.length; n++) {

                   var c = string.charCodeAt(n);

                   if (c < 128) {
                           utftext += String.fromCharCode(c);
                   }
                   else if((c > 127) && (c < 2048)) {
                           utftext += String.fromCharCode((c >> 6) | 192);
                           utftext += String.fromCharCode((c & 63) | 128);
                   }
                   else {
                           utftext += String.fromCharCode((c >> 12) | 224);
                           utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                           utftext += String.fromCharCode((c & 63) | 128);
                   }

           }

           return utftext;
   };

   var x=Array();
   var k,AA,BB,CC,DD,a,b,c,d;
   var S11=7, S12=12, S13=17, S14=22;
   var S21=5, S22=9 , S23=14, S24=20;
   var S31=4, S32=11, S33=16, S34=23;
   var S41=6, S42=10, S43=15, S44=21;

   string = Utf8Encode(string);

   x = ConvertToWordArray(string);

   a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

   for (k=0;k<x.length;k+=16) {
           AA=a; BB=b; CC=c; DD=d;
           a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
           d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
           c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
           b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
           a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
           d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
           c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
           b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
           a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
           d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
           c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
           b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
           a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
           d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
           c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
           b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
           a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
           d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
           c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
           b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
           a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
           d=GG(d,a,b,c,x[k+10],S22,0x2441453);
           c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
           b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
           a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
           d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
           c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
           b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
           a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
           d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
           c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
           b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
           a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
           d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
           c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
           b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
           a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
           d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
           c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
           b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
           a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
           d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
           c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
           b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
           a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
           d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
           c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
           b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
           a=II(a,b,c,d,x[k+0], S41,0xF4292244);
           d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
           c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
           b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
           a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
           d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
           c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
           b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
           a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
           d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
           c=II(c,d,a,b,x[k+6], S43,0xA3014314);
           b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
           a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
           d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
           c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
           b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
           a=AddUnsigned(a,AA);
           b=AddUnsigned(b,BB);
           c=AddUnsigned(c,CC);
           d=AddUnsigned(d,DD);
                }

        var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

        return temp.toLowerCase();
}

 exports.crc32 = function (str) {    
    var crc = ~0, i;
    for (i = 0, l = str.length; i < l; i++) {
        crc = (crc >>> 8) ^ crc32tab[(crc ^ str.charCodeAt(i)) & 0xff];
    }
    crc = Math.abs(crc ^ -1);
    return crc.toString(16);//hex ? crc.toString(16) : crc;
};



var crc32tab = [
    0x00000000, 0x77073096, 0xee0e612c, 0x990951ba,
    0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3,
    0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988,
    0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91,
    0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
    0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
    0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec,
    0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5,
    0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172,
    0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
    0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940,
    0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
    0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116,
    0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f,
    0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
    0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d,
    0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a,
    0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
    0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818,
    0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
    0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
    0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457,
    0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c,
    0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
    0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
    0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb,
    0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0,
    0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9,
    0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086,
    0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
    0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4,
    0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad,
    0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a,
    0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683,
    0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
    0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
    0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe,
    0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7,
    0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc,
    0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
    0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252,
    0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
    0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60,
    0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79,
    0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
    0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f,
    0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04,
    0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
    0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a,
    0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
    0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38,
    0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21,
    0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e,
    0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
    0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
    0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45,
    0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2,
    0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db,
    0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0,
    0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
    0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6,
    0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf,
    0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
    0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
];
});

_sardines.register("/modules/beanpoll/lib/push/plugin.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Director;

  Director = require("./director");

  module.exports = function(router) {
    /*
    */
    var director;
    director = new Director("push", router);
    return {
      /*
      */
      name: director.name,
      /*
      */
      director: director,
      /*
      */
      newListener: function(listener) {
        return router.request('new/listener').tag('private', true).query(listener).push();
      },
      /*
      */
      router: {
        push: function(path, query, headers) {
          return this.request(path, query, headers).push(null);
        }
      },
      /*
      */
      request: {
        push: function(data) {
          var writer;
          writer = this.dispatch(director.name);
          if (!!arguments.length) writer.end(data);
          return writer;
        }
      }
    };
  };

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/pull/plugin.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Director, outcome;

  Director = require("./director");

  outcome = require("outcome");

  module.exports = function(router) {
    var director;
    director = new Director("pull", router);
    return {
      name: director.name,
      /*
      */
      director: director,
      /*
      */
      newListener: function(listener) {
        if (!!listener.route.tags.pull) {
          return router.request(listener.route.path).headers(listener.route.tags).success(listener.callback).error(function() {}).pull();
        }
      },
      /*
      	 extend the router
      */
      router: {
        pull: function(path, query, headers, callback) {
          return this._pull(path, query, headers, callback, director.name);
        },
        _pull: function(path, query, headers, callback, type) {
          if (typeof query === 'function') {
            callback = query;
            headers = null;
            query = null;
          }
          if (typeof headers === 'function') {
            callback = headers;
            headers = null;
          }
          return this.request(path, query, headers)[type](callback);
        }
      },
      /*
      	 extend the request builder
      */
      request: {
        pull: function(query, callback) {
          return this._pull(query, callback, director.name);
        },
        _pull: function(query, callback, type) {
          if (typeof query === 'function') {
            callback = query;
            query = null;
          }
          if (!!query) this.query(query);
          if (!!callback) this.response(callback);
          return this.dispatch(type);
        }
      }
    };
  };

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/collect/plugin.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Director, outcome;

  Director = require("./director");

  outcome = require("outcome");

  module.exports = function(router) {
    var director;
    director = new Director("collect", router);
    return {
      name: director.name,
      director: director,
      router: {
        collect: function(path, query, headers, callback) {
          return this._pull(path, query, headers, callback, director.name);
        }
      },
      newListener: function(listener) {
        if (!!listener.route.tags.collect) {
          return router.request(listener.route.path).headers(listener.route.tags).success(listener.callback).collect();
        }
      },
      request: {
        collect: function(query, callback) {
          return this._pull(query, callback, director.name);
        }
      }
    };
  };

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/plugins.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Request, _;

  Request = require('./request');

  _ = require('underscore');

  module.exports = (function() {
    /*
    */
    function _Class(router) {
      this.router = router;
      this._pluginsByName = {};
      this._using = [];
    }

    _Class.prototype.using = function() {
      return this._using;
    };

    /*
    */

    _Class.prototype.add = function(plugin) {
      var mod, plg, _i, _len;
      if (plugin instanceof Array) {
        for (_i = 0, _len = plugin.length; _i < _len; _i++) {
          plg = plugin[_i];
          this.add(plg);
        }
        return;
      }
      this._using.push(plugin);
      mod = plugin(this.router);
      this._pluginsByName[mod.name] = mod;
      _.extend(this.router._requestBuilder, mod.request);
      _.extend(this.router, mod.router);
      if (mod.director) return this.router.directors[mod.name] = mod.director;
    };

    /*
    */

    _Class.prototype.get = function(name) {
      return this._pluginsByName[name];
    };

    /*
    	 Used incase the listener needs to be handler for a particular reason, e.g: push -pull /some/route would be a binding.
    */

    _Class.prototype.newListener = function(listener) {
      return this._emit('newListener', listener);
    };

    /*
    */

    _Class.prototype._emit = function(type, data) {
      var plugin, pluginName, _results;
      _results = [];
      for (pluginName in this._pluginsByName) {
        plugin = this._pluginsByName[pluginName];
        if (plugin[type]) {
          _results.push(plugin[type](data));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return _Class;

  })();

}).call(this);

});

_sardines.register("/modules/disposable/lib/index.js", function(require, module, exports, __dirname, __filename) {
	

(function() {

	var disposable = {};
		


	disposable.create = function() {
		
		var self = {},
		disposables = [];


		self.add = function(disposable) {

			if(typeof disposable == 'function') {
				
				var disposableFunc = disposable, args = Array.prototype.slice.call(arguments, 0);

				//remove the func
				args.shift();


				disposable = {
					dispose: function() {
						disposableFunc.apply(null, args);
					}
				};
			}


			disposables.push(disposable);

			return {
				dispose: function() {
					var i = disposables.indexOf(disposable);

					if(i > -1) disposables.splice(i, 1);
				}
			};
		};

		self.addTimeout = function(timerId) {
			return self.add(clearTimeout, timerId);
		};

		self.addInterval = function(timerId) {
			return self.add(clearInterval, timerId);
		};



		self.dispose = function() {
			
			for(var i = disposables.length; i--;) {
				disposables[i].dispose();
			}

			disposables = [];
		};

		return self;
	}



	if(typeof module != 'undefined') {
		module.exports = disposable;
	}

	if(typeof window != 'undefined') {
		window.disposable = disposable;
	}


})();

var disposable = module.exports.create();


disposable.dispose();

});

_sardines.register("/modules/disposable", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/disposable/lib/index.js');
});

_sardines.register("/modules/beanpoll/lib/collections/linkedQueue.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var EventEmitter, LinkedQueue,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  module.exports = LinkedQueue = (function(_super) {

    __extends(LinkedQueue, _super);

    LinkedQueue.prototype.hasNext = true;

    /*
    	 moves into the next
    */

    function LinkedQueue(first, onNext) {
      this.first = first;
      LinkedQueue.__super__.constructor.call(this);
      this.last = first.getLastSibling();
      if (onNext) this._onNext = onNext;
    }

    /*
    	 moves onto the next request (middleware)
    */

    LinkedQueue.prototype.next = function() {
      if (!this.hasNext) return false;
      this._setNext();
      this._onNext(this.current, arguments);
      return true;
    };

    /*
    	 skips middleware
    */

    LinkedQueue.prototype.skipNext = function(count) {
      if (count == null) count = 2;
      if (!this.hasNext) return false;
      while ((count--) && this.hasNext) {
        this._setNext();
      }
      this._onNext(this.current);
      return true;
    };

    /*
    */

    LinkedQueue.prototype._setNext = function() {
      this.current = this.current ? this.current.getNextSibling() : this.first;
      this.hasNext = this.current.getNextSibling();
      if (!this.hasNext && !this.ended) {
        this.ended = true;
        return this._onEnd();
      }
    };

    /*
    */

    LinkedQueue.prototype._onNext = function(middleware) {};

    /*
    */

    LinkedQueue.prototype._onEnd = function() {};

    return LinkedQueue;

  })(EventEmitter);

  module.exports = LinkedQueue;

}).call(this);

});

_sardines.register("/modules/dolce/lib/index.js", function(require, module, exports, __dirname, __filename) {
	exports.collection = require('./collection');
});

_sardines.register("/modules/dolce", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/dolce/lib/index.js');
});

_sardines.register("/modules/beanpoll/lib/concrete/middleware.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var LinkedList, Middleware,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  LinkedList = require("../collections/linkedList");

  module.exports = Middleware = (function(_super) {

    __extends(Middleware, _super);

    /*
    	 constructor
    */

    function Middleware(item, director) {
      this.director = director;
      this.listener = item.value;
      this.path = {
        segments: item.cmpSegments
      };
      this.params = item.params;
      this.tags = item.tags;
    }

    return Middleware;

  })(LinkedList);

  /*
   Wraps the chained callbacks in middleware
  */

  Middleware.wrap = function(chain, pre, next, director) {
    var current, item, prev, _i, _len;
    for (_i = 0, _len = chain.length; _i < _len; _i++) {
      item = chain[_i];
      current = new Middleware(item, director);
      if (prev) current.addPrevSibling(prev, true);
      prev = current;
    }
    if (typeof pre === 'function') {
      current.getFirstSibling().addPrevSibling(new Middleware({
        value: pre,
        params: {},
        tags: {},
        path: {
          segments: []
        }
      }));
    }
    if (typeof next === 'function') {
      current.addNextSibling(new Middleware({
        value: next,
        params: {},
        tags: {},
        path: {
          segments: []
        }
      }));
    }
    return current.getFirstSibling();
  };

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/io/reader.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Reader, Stream, disposable,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Stream = require("stream").Stream;

  disposable = require("disposable");

  module.exports = Reader = (function(_super) {

    __extends(Reader, _super);

    /*
    */

    function Reader(source) {
      this.source = source;
      Reader.__super__.constructor.call(this);
      this.setMaxListeners(0);
      this._listen();
    }

    /*
    	 needs to be overridable incase there's more stuff to listen to (headers)
    */

    Reader.prototype._listenTo = function() {
      return ["data", "end", "error"];
    };

    /*
    */

    Reader.prototype._listen = function() {
      var event, listeners, _fn, _i, _len, _ref,
        _this = this;
      this._buffer = [];
      listeners = disposable.create();
      if (this.source) {
        _ref = this._listenTo();
        _fn = function(event) {
          var onEvent;
          onEvent = function(arg1, arg2) {
            _this._started = true;
            return _this.emit(event, arg1, arg2);
          };
          _this.source.on(event, onEvent);
          return listeners.add(function() {
            return _this.source.removeListener(event, onEvent);
          });
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _fn(event);
        }
      }
      this.on("data", function(data, encoding) {
        if (!_this._cache) return;
        return _this._buffer.push({
          chunk: data,
          encoding: encoding
        });
      });
      this.on("end", function() {
        if (_this.ended) throw new Error("Cannot end more than once");
        return _this.ended = true;
      });
      return this.on("error", function(err) {
        return _this.error = err;
      });
    };

    /*
    */

    Reader.prototype.setEncoding = function(encoding) {
      var _ref;
      return (_ref = this.source) != null ? _ref.setEncoding(encoding) : void 0;
    };

    /*
    */

    Reader.prototype.pause = function() {
      var _ref;
      return (_ref = this.source) != null ? typeof _ref.pause === "function" ? _ref.pause() : void 0 : void 0;
    };

    /*
    */

    Reader.prototype.resume = function() {
      var _ref;
      return (_ref = this.source) != null ? typeof _ref.resume === "function" ? _ref.resume() : void 0 : void 0;
    };

    /*
    */

    Reader.prototype.destroy = function() {
      var _ref;
      return (_ref = this.source) != null ? typeof _ref.destroy === "function" ? _ref.destroy() : void 0 : void 0;
    };

    /*
    */

    Reader.prototype.destroySoon = function() {
      var _ref;
      return (_ref = this.source) != null ? typeof _ref.destroySoon === "function" ? _ref.destroySoon() : void 0 : void 0;
    };

    /*
    	 flags the reader that data should be cached as it's coming in.
    */

    Reader.prototype.cache = function(value) {
      if (arguments.length) this._cache = value || !!this._buffer.length;
      return this._cache;
    };

    /*
     	 listens on a reader, and pipes it to a callback a few ways
    */

    Reader.prototype.dump = function(callback, ops) {
      var pipedStream, wrappedCallback;
      if (!ops) ops = {};
      wrappedCallback = this._dumpCallback(callback, ops);
      pipedStream = this._started ? new Reader(this) : this;
      wrappedCallback.call(this, null, pipedStream);
      if (!this._started) return;
      return this._dumpCached(pipedStream, ops);
    };

    /*
    */

    Reader.prototype._dumpCallback = function(callback, ops) {
      var listeners, pipeTo,
        _this = this;
      if (callback instanceof Stream) {
        ops.stream = true;
        pipeTo = callback;
        callback = function(err, stream) {
          var type, _fn, _i, _len, _ref;
          _ref = _this._listenTo();
          _fn = function(type) {
            return stream.on(type, function() {
              return pipeTo.emit.apply(pipeTo, [type].concat(Array.prototype.slice.call(arguments)));
            });
          };
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            type = _ref[_i];
            _fn(type);
          }
          return null;
        };
      }
      if (typeof callback === 'object') {
        ops.stream = true;
        listeners = callback;
        callback = function(err, stream) {
          var type, _results;
          _results = [];
          for (type in listeners) {
            _results.push(stream.on(type, listeners[type]));
          }
          return _results;
        };
      }
      if (ops.stream) return callback;
      return function(err, reader) {
        var buffer, onEnd;
        if (err) return callback(err);
        buffer = [];
        onEnd = function(err) {
          var chunk, _i, _len, _results;
          if (ops.batch) return callback.call(_this, err, buffer);
          if (!buffer.length) return callback.call(_this, err);
          if (ops.each) {
            _results = [];
            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
              chunk = buffer[_i];
              _results.push(callback.call(_this, err, chunk));
            }
            return _results;
          } else {
            return callback.call(_this, err, buffer.length > 1 ? buffer : buffer[0]);
          }
        };
        reader.on("data", function(data, encoding) {
          return buffer.push(data);
        });
        reader.on("error", onEnd);
        return reader.on("end", onEnd);
      };
    };

    /*
    */

    Reader.prototype._dumpCached = function(pipedReader) {
      var data, _i, _len, _ref;
      _ref = this._buffer;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        pipedReader.emit("data", data.chunk, data.encoding);
      }
      if (this.ended) pipedReader.emit("end");
      if (this.error) return pipedReader.emit("error");
    };

    return Reader;

  })(Stream);

  Reader.prototype.readable = true;

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/io/writer.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Reader, Stream, Writer,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Stream = require("stream").Stream;

  Reader = require("./reader");

  module.exports = Writer = (function(_super) {

    __extends(Writer, _super);

    function Writer() {
      Writer.__super__.constructor.call(this);
      this.setMaxListeners(0);
    }

    /*
    */

    Writer.prototype.error = function(err) {
      if (typeof err === 'string') err = new Error(err);
      return this.emit("error", err);
    };

    /*
    */

    Writer.prototype.write = function(chunk, encoding) {
      if (encoding == null) encoding = "utf8";
      return this.emit("data", chunk, encoding);
    };

    /*
    */

    Writer.prototype.end = function(chunk, encoding) {
      if (chunk) this.write(chunk, encoding);
      if (this.ended) throw new Error("Cannot call end twice");
      this.ended = true;
      this.emit("end");
      return this;
    };

    /*
    */

    Writer.prototype.reader = function() {
      return new Reader(this);
    };

    return Writer;

  })(Stream);

  Writer.prototype.writable = true;

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/push/director.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Director, Messenger,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Director = require("../concrete/director");

  Messenger = require("./messenger");

  module.exports = (function(_super) {

    __extends(_Class, _super);

    function _Class() {
      _Class.__super__.constructor.apply(this, arguments);
    }

    _Class.prototype.passive = true;

    /*
    */

    _Class.prototype._newMessenger = function(request, middleware) {
      return new Messenger(request, middleware, this);
    };

    return _Class;

  })(Director);

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/pull/director.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Director, Messenger,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Director = require("../concrete/director");

  Messenger = require("./messenger");

  module.exports = (function(_super) {

    __extends(_Class, _super);

    function _Class() {
      _Class.__super__.constructor.apply(this, arguments);
    }

    _Class.prototype.passive = false;

    /*
    */

    _Class.prototype._newMessenger = function(request, middleware) {
      return new Messenger(request, middleware, this);
    };

    /*
    */

    _Class.prototype.getListeners = function(request, search) {
      return this.prepareListeners(_Class.__super__.getListeners.call(this, request, search));
    };

    /*
    */

    _Class.prototype.prepareListeners = function(listeners) {
      if (!!listeners.length) {
        return [listeners[0]];
      } else {
        return [];
      }
    };

    return _Class;

  })(Director);

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/collect/director.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Director,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Director = require("../pull/director");

  module.exports = (function(_super) {

    __extends(_Class, _super);

    function _Class() {
      _Class.__super__.constructor.apply(this, arguments);
    }

    _Class.prototype.passive = true;

    /*
    */

    _Class.prototype.prepareListeners = function(listeners) {
      return listeners;
    };

    return _Class;

  })(Director);

}).call(this);

});

_sardines.register("/modules/dolce/lib/collection.js", function(require, module, exports, __dirname, __filename) {
	var crema  = require('crema'),
tree 	   = require('./tree'),
sift 	   = require('sift'),
_          = require('underscore');

var routeTypes = {
	'*': 'extend',
	'+': 'extend',
	'**': 'greedy'
}


var collection = module.exports = function() {
	
	var _rootTree = tree(),
	self = {},
	_id = 0;


	var _addRoute = self.add = function(route, value) {

		var tree, type, segments = route.path.segments, 
		lastPath = segments[segments.length - 1].value, 
		secondLastPath = segments.length > 1 ? segments[segments.length - 2].value : null;


		if(type = routeTypes[lastPath]) {
			
			//remove the asterick
			route.path.segments.pop();

		} else {

			type = 'endpoint';

		}


		var thru = [], cthru = route.thru;

		while(cthru) {
			thru.unshift(cthru.path.segments);
			cthru = cthru.thru;
		}

		//next, let's find the tree this route belongs too
		tree = _findTree(route.path.segments, true);


		//add the data to the tree obj
		return tree.addListener(type, {

			routeStr: crema.stringify(route),

			//filterable tags
			tags: route.tags,

			//path to the route -- needed to fill in extra data
			segments: route.path.segments,

			//explicit chain which gets expanded at runtime
			thru: thru,

			id: _id++,

			//the callback function
			value: value

		}, type);

	};

	/**
	 * returns TRUE if the given type exists
	 */

	self.contains = function(path, ops) {

		if(!ops) ops = {};

		var child = _findTree(path.segments);

		return !!child ? !!_andSifter(ops, child.collections.endpoint).length : false;
	}

	/**
	 * returns collections and their chained data
	 */

	self.get = function(path, ops) {
		
		if(!ops) ops = {};


		//only allow path/to/collection in get vs pull blown parsing with metadata - not necessary
		var chains = _chains(path.segments, ops, true).sort(function(a, b) {
			return Number(a[a.length - 1].tags.priority || 0) > Number(b[b.length - 1].tags.priority || 0) ? -1 : 1;
		});

			

		return {
			segments: path.segments,
			tags: ops.tags,
			chains: chains
		}
	};



	/**
	 */

	self.remove = function(path, ops) {

		var child = _findTree(path.segments),
		sifter = _andSifter(ops);

		for(var i = child.collections.endpoint.length; i--;) {
			if(sifter.test(child.collections.endpoint[i])) {
				child.collections.endpoint.splice(i, 1);
			}
		}

	}

	/**
	 * finds routes based on the filter tags given WITHOUT expanding them
	 */

	self.find = function(ops) {

		var tagSifter, found = [];

		if(ops.tags) {
			tagSifter = _andSifter(ops);
		} else 
		if(ops.siftTags) {
			tagSifter = sift({ tags: ops.siftTags });
		}



		_rootTree.traverse(function(tree) {

			if(tagSifter)
			for(var i = tree.collections.endpoint.length; i--;) {

				var data = tree.collections.endpoint[i];

				if(tagSifter.test(data)) {
					
					found.push(data);

					break;
				}
			}

		});

		return found;
	}

	//changes {tag:value,tag2:value} to [{tag:value},{tag2:value}]
	var _tagsToArray = function(tagsObj) {
			
		var key, tag, tags = [];

		for(key in tagsObj) {
			
			tag = {};
			tag[key] = tagsObj[key];
			tags.push(tag);

		}

		return tags;
	}


	/**
	 */

	var _andSifter = function(ops, target) {

		var tags = ops.tags || {};

		for(var name in tags) {
			if(tags[name] === true) {
				tags[name] = { $exists: true };
			}
		}

		var $and = _tagsToArray(tags);

		if(ops.siftTags) $and.push(ops.siftTags);

		return sift({ tags: { $and: $and }}, target);

	}

	/**
	 */

	var _chains = function(segments, ops) {
		

		var child  = _rootTree.findChild(segments);

		//route does NOT exist? return a greedy endpoint
		if(!child) {
			return [];//_greedyEndpoint(segments, tags);
		}

		var entireChain = _allCollections(child),

		currentData,

		endCollection = _andSifter(ops)(child.collections.endpoint),

		//the collections expanded with all the explicit / implicit / greedy chains
		expandedChains = [],

		expandedChain;


		//now we need to expand the EXPLICIT chain. Stuff like pass -> thru -> route
		for(var i = 0, n = endCollection.length; i < n; i++) {

			currentData = endCollection[i];
			
			expandedChains.push((ops.expand == undefined || ops.expand == true) ? _chain(currentData, segments, entireChain, ops.throwErrors) : [currentData]);
		}



		return expandedChains;
	};

	var _chain = function(data, segments, entireChain, throwErrors) {

		var tags = data.tags;

		var chain = _siftChain(tags, entireChain);


		var usedGreedyPaths = {};


		//filter out any greedy middleware that's used more than once. This can cause problems
		//for greedy middleware such as /**
		return _expand(chain.concat(data), segments, throwErrors).filter(function(route) {

			if(route.type != 'greedy') return true;
			if(usedGreedyPaths[route.id]) return false;
			return usedGreedyPaths[route.id] = true;

		});
	}

	var _greedyEndpoint = function(segments, tags) {
		
		var tree;

		for(var i = segments.length; i--;) {
			if(tree = _rootTree.findChild(segments.slice(0, i))) break;	
		}

		if(!tree) return [];

		var chain = _siftChain(tags || {}, _greedyCollections(tree));

		return chain;

	}

	var _copy = function(target) {
		var to = {};
		for(var i in target) {
			to[i] = target[i];
		}
		return to;
	}

	/**
	 */

	var _expand = function(chain, segments, throwErrors) {
		
		var j, n2,  i = 0, n = chain.length;


		var expanded = [];


		for(; i < n; i++) {
			
			var data = chain[i];

			var params = _params(data.segments, segments),
			subChain = [];
			
			for(j = 0, n2 = data.thru.length; j < n2; j++) {
					
				subChain.push(_thru(_fillPaths(data.thru[j], params), data.tags, throwErrors));

			}

			expanded = expanded.concat.apply(expanded, subChain);

			expanded.push({
				routeStr: data.routeStr,
				segments: data.segments,
				cmpSegments: segments,
				params: params,
				id: data.id,
				tags: data.tags,
				value: data.value,
				type: data.type
			});
		}

		return expanded;
	}


	/**
	 */

	var _siftChain = function(tags, target) {

		var usable = [], prev;

		//used for greedy middleware - this is especially important for items that do this:
		// -perm /**
		// -perm -unfilterable todos/**
		// -method=GET todos

		//NOTE: we *cannot* use prev-tags for this. This wouldn't work:
		//-perm /**
		//a/**
		//-perm -unfilterable a/b/**
		//-method=GET a/b/c
		toFind = _.extend({}, tags);



		for(var i = target.length; i--;) {

			var a  = target[i],
			atags  = a.tags,
			canUse = true;



			if(a.greedy) {


				//examples of this:
				//-method a/**
				//-method=POST a  --- a/** -> a
				//a --- a (would not go through a/**)
				if(!atags.unfilterable) {
					for(var tagName in atags) {


						av = atags[tagName];
						tv = toFind[tagName];

						//MUST have a value - atags

						//Example:

						//-method=POST a/**

						//matches: 
						//-method=POST a

						//does not match:
						//-method a

						if(av != tv && (!tv || av !== true) && av != '*')  {

							canUse = false;
							break;
						}
					}
				}

			} else {



				for(var tagName in tags) {

					var tv = tags[tagName],
					av     = atags[tagName];

						

					//"-m=a a" matches: "-m=a a/+", "-m a", "a", "-b a"
					//"-m=a a" does NOT match: "-m=b a/+"
					if(tv != av && av !== undefined && av !== true) { 
						canUse = false;
						break;
					}
				}

			}

			if(canUse) {
				_.extend(toFind, atags);
				usable.unshift(a);
			}
		}

		return usable;
	}

	var _doesNotExist = function(segments) {
		throw new Error("route " + crema.stringifySegments(segments, null, true) + " does not exist");
	}


	/**
	 */

	var _thru = function(segments, tags, throwErrors) {

		var child  = _rootTree.findChild(segments);

		if(!child) {
			if(throwErrors) {
				_doesNotExist(segments);
			}
			return [];
		}


		//need to sort the tags because a match for say.. method=DELETE matches both method, and method=DELETE
		//NOTE - chainSifter was previously used here. Since it's EXPLICIT, we do NOT want to filter out the routes.
		var filteredChildren = child.collections.endpoint.sort(function(a, b) {

			return _scoreTags(a.tags, tags) > _scoreTags(b.tags, tags) ? -1 : 1;

		});

		var targetChild = filteredChildren[0];


		var chain = _siftChain(targetChild.tags, _allCollections(child));


		//return only ONE item to go through - this is the best match.
		return _expand(chain.concat(targetChild), segments, throwErrors);
	}

	/**
	 * ranks data based on how similar tags are
	 */

	var _scoreTags = function(tags, match) {
		var score = 0;


		for(var tag in match) {

			var tagV = tags[tag];

			if(tagV == match[tag]) {

				score += 2;

			} else 
			if(tagV) {

				score += 1;

			}
		}

		return score;
	}


	/**
	 * hydrates chain, e.g.,  validate/:firstName -> add/user/:firstName
	 */

	var _fillPaths = function(segments, params) {
		var i, path, n = segments.length, newPaths = [];

		for(i = 0; i < n; i++) {
			
			path = segments[i];

			newPaths.push({
				value: path.param ? params[path.value] : path.value,
				param: path.param
			});
		}

		return newPaths;
	}

	/**
	 * returns the parameters associated with the found path against the queried path, e.g., add/:name/:last and add/craig/condon 
	 */

	var _params = function(treePaths, queryPaths) {
		
		var i, treePath, queryPath, params = {};

		for(i = treePaths.length; i--;) {

			treePath = treePaths[i];
			queryPath = queryPaths[i];

			if(treePath.param) {

				params[treePath.value] = queryPath.value;

			}

		}


		return params;
	};

	/**
	 */

	var _greedyCollections = function(tree) {
		
		var currentParent = tree,
		collections = [],
		gcol = [],
		cpath;

		while(currentParent) {
			 
			cpath = currentParent.pathStr();
			collections = currentParent.collections.greedy.concat(collections);

			currentParent = currentParent.parent();
		}

		return collections;
	};

	/**
	 */

	var _allCollections = function(tree) {
		
		return _greedyCollections(tree).concat(tree.collections.extend);

	}


	/**
	 * finds the deepest tree associated with the given segments
	 */


	var _findTree = function(segments, createIfNotFound) {
		
		var i, path, n = segments.length, currentTree = _rootTree;

		for(i = 0; i < n; i++) {
			
			path = segments[i];

			if(!(currentTree = currentTree.child(path, createIfNotFound))) break;

		}

		return currentTree;

	};



	return self;
}


});

_sardines.register("/modules/beanpoll/lib/collections/linkedList.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var LinkedList;

  module.exports = LinkedList = (function() {

    function LinkedList() {}

    /*
    */

    LinkedList.prototype.getNextSibling = function() {
      return this._nextSibling;
    };

    /*
    */

    LinkedList.prototype.addNextSibling = function(sibling, replNext) {
      if (!!this._nextSibling) this._nexSibling._prevSibling = sibling;
      sibling._prevSibling = this;
      if (!replNext) sibling._nextSibling = this._nextSibling;
      return this._nextSibling = sibling;
    };

    /*
    */

    LinkedList.prototype.getPrevSibling = function() {
      return this._prevSibling;
    };

    /*
    */

    LinkedList.prototype.addPrevSibling = function(sibling, replPrev) {
      if (!!this._prevSibling) this._prevSibling._nextSibling = sibling;
      sibling._nextSibling = this;
      if (!replPrev) sibling._prevSibling = this._prevSibling;
      return this._prevSibling = sibling;
    };

    /*
    */

    LinkedList.prototype.getFirstSibling = function() {
      var first;
      first = this;
      while (!!first._prevSibling) {
        first = first._prevSibling;
      }
      return first;
    };

    /*
    */

    LinkedList.prototype.getLastSibling = function() {
      var last;
      last = this;
      while (!!last._nextSibling) {
        last = last._nextSibling;
      }
      return last;
    };

    return LinkedList;

  })();

}).call(this);

});

_sardines.register("/modules/stream", function(require, module, exports, __dirname, __filename) {
	// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var events = require('events');
var util = require('util');

function Stream() {
  events.EventEmitter.call(this);
}
util.inherits(Stream, events.EventEmitter);
module.exports = Stream;
// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    // remove the listeners
    cleanup();

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    // remove the listeners
    cleanup();

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};


});

_sardines.register("/modules/beanpoll/lib/push/messenger.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Messenger,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Messenger = require("../concrete/messenger");

  module.exports = (function(_super) {

    __extends(_Class, _super);

    function _Class() {
      _Class.__super__.constructor.apply(this, arguments);
    }

    /*
    */

    _Class.prototype._next = function(middleware) {
      return middleware.listener.call(this, this.request.query, this);
    };

    /*
    	 ack on end
    */

    _Class.prototype._onEnd = function() {
      return this.response.end();
    };

    return _Class;

  })(Messenger);

}).call(this);

});

_sardines.register("/modules/beanpoll/lib/pull/messenger.js", function(require, module, exports, __dirname, __filename) {
	(function() {
  var Messenger,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Messenger = require("../concrete/messenger");

  module.exports = (function(_super) {

    __extends(_Class, _super);

    function _Class() {
      _Class.__super__.constructor.apply(this, arguments);
    }

    /*
    */

    _Class.prototype.start = function() {
      this.response.req = this.request;
      return _Class.__super__.start.call(this);
    };

    /*
    */

    _Class.prototype._next = function(middleware) {
      return middleware.listener.call(this, this.request, this.response, this);
    };

    /*
    */

    _Class.prototype._onError = function(error) {
      return this.response.error(error);
    };

    return _Class;

  })(Messenger);

}).call(this);

});

_sardines.register("/modules/dolce/lib/tree.js", function(require, module, exports, __dirname, __filename) {
	var crema = require('crema');

var tree = module.exports = function(ops) {

	//ops doesn't exist? it's the root
	if(!ops) ops = { name: '', 
	param: false, 
	parent: null,
	depth: 0,
	deepest: 0};

	//child trees
	var _children = {},

	//THIS tree
	self = {},

	//parent tree obj
	_parent = ops.parent,

	//the root tree /
	_root   = ops.root || self,

	//collections added to this tree?
	_hasListeners = false,

	//the path value to THIS tree object
	_path   = { value: ops.name, param: ops.param },

	//used for debugging
	_pathStr = _parent ? _parent.path().value + '/' + ops.name : '/',

	//string rep of path to the tree
	_segments = _parent ? _parent.segments().concat(_path) : [_path],

	_pathStr = crema.stringifySegments(_segments);

	self.collections = {

		//chain is path/**, which means everything *after* path is handled by this route, which
		//means we need to fetch the parent chain
		greedy: [],

		greedyExtend: [],

		//handled before after
		extend: [],

		//handled last
		endpoint: []
	};



	var _addListener = self.addListener = function(type, data) {
		
		var collections = self.collections[type];
		data.path       = _pathStr;
		data.type       = type;

		if(type.indexOf('greedy') > -1) data.greedy = true;

		collections.push(data);

		_hasListeners = true;

		return {

			/**
			 * removes the data from the collection
			 */

			dispose: function() {
				
				var i = collections.indexOf(data);

				//make sure the data exists before removing it from the collection
				if(i > -1) collections.splice(i, 1);

			}
		}
	}

	var _greedyListeners = function() {

		if(!_parent) return [];
	}

	/**
	 * traverse the tree
	 */

	self.traverse = function(callback) {
		callback(this);

		for(var name in _children) {
			_children[name].traverse(callback);
		}
	}


	/**
	 * retrieves a child path
	 */

	self.child = function(path, createIfNotFound) {
		
		//if the path is a parameter, then the NAME is __param as well
		var name = path.param ? '__param' : path.value;

		//return the child if it exists
		if(_children[name]) return _children[name];

		//otherwise, *create* the child 
		if(createIfNotFound) {

			return _children[name] = tree({ name: name,
				param: path.param, 
				parent: self, 
				root: _root,
				depth: ops.depth + 1, 
				deepest: 0 });

		}

		return null;
	}

	/**
	 * finds a child based segments given
	 */

	self.findChild = function(segments) {

		return _findChildren(self, segments, 0);
	};


	var _findChild = self._findChild = function(segments, index, weighTowardsParam) {

		var currentPath, foundChild, childTree;

		//are we at the end?
		if(segments.length - index == 0) {

			return _hasListeners ? self : null;

		}

		currentPath = segments[index];

		//if we're weighing for parameters, then a route has not been defined
		//for the given path
		if(!weighTowardsParam || !(childTree = _children.__param)) {

			childTree = _children[currentPath.value];

		}


		return childTree ? _findChildren(childTree, segments, index + 1) : null;
	}


	var _findChildren = function(tree, segments, index) {
		
		if(!tree) return null;

		// var param = segments[index] ? segments[index].param : false, found;

		var found;

		//SUPER NOTE:
		// before we'd check if there was a parameter. IF there was then we'd skip the weight towards a non-param route.
		// This is counter-intuitive. IF i have routes:
		// make/task
		// make/web
		// make/:something
		// and I call: make/:something -> makeIt, with :something as "task", I'd expect to hit the explicit "make/task" route vs the parameter.
		//

		if(found = tree._findChild(segments, index, false)) return found;


		return  tree._findChild(segments, index, true);
	}


	/**
	 * returns the current parent
	 */

	self.parent = function() {

		return _parent;

	};

	self.path = function() {
		
		return _path;
	}

	self.pathStr = function() {
		
		return _pathStr;

	}

	self.segments = function() {

		return _segments;
		
	}



	return self;
}
});

_sardines.register("/modules/sift/sift.js", function(require, module, exports, __dirname, __filename) {
	/*
 * Sift
 * 
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language 
 */


(function() {


	

	var _queryParser = new (function() {

		/**
		 * tests against data
		 */

		var test = this.test = function(statement, data) {

			var exprs = statement.exprs;


			//generally, expressions are ordered from least efficient, to most efficient.
			for(var i = 0, n = exprs.length; i < n; i++) {

				var expr = exprs[i];


				if(!expr.e(expr.v, _comparable(data), data)) return false;

			}

			return true;
		}


		/**
		 * parses a statement into something evaluable
		 */

		var parse = this.parse = function(statement, key) {

			var testers = [];
				
			if(statement)
			//if the statement is an object, then we're looking at something like: { key: match }
			if(statement.constructor == Object) {

				for(var k in statement) {

					//find the apropriate operator. If one doesn't exist, then it's a property, which means
					//we create a new statement (traversing) 
					var operator = !!_testers[k] ?  k : '$trav',

					//value of given statement (the match)
					value = statement[k],

					//default = match
					exprValue = value;

					//if we're working with a traversable operator, then set the expr value
					if(TRAV_OP[operator]) {
						
						//*if* the value is an array, then we're dealing with something like: $or, $and
						if(value instanceof Array) {
							
							exprValue = [];

							for(var i = value.length; i--;) {

								exprValue.push(parse(value[i]));
									
							}

						//otherwise we're dealing with $trav
						} else {
							
							exprValue = parse(statement[k], k);

						}
					} 
					

					testers.push(_getExpr(operator, k, exprValue));

				}
								

			//otherwise we're comparing a particular value, so set to eq
			} else {

				testers.push(_getExpr('$eq', k, statement));

			}

			var stmt =  { 

				exprs: testers,
				k: key,
				test: function(value) {
					
					return test(stmt, value);

				} 

			};
			
			return stmt;
		
		}


		//traversable statements
		var TRAV_OP = {

			$and: true,
			$or: true,
			$nor: true,
			$trav: true,
			$not: true

		}


		function _comparable(value) {

			if(value instanceof Date) {

				return value.getTime();
			
			} else {

				return value;
			
			}
		}


		var _testers = {

			/**
			 */

			$eq: function(a, b) {

				return a.test(b);

			},

			/**
			 */

			$ne: function(a, b) {

				return !a.test(b);

			},

			/**
			 */

			$lt: function(a, b) {

				return a > b;

			},

			/**
			 */

			$gt: function(a, b) {

				return a < b;

			},

			/**
			 */

			$lte: function(a, b) {

				return a >= b;

			},

			/**
			 */

			$gte: function(a, b) {

				return a <= b;

			},


			/**
			 */

			$exists: function(a, b) {

				return a == !!b;

			},

			/**
			 */

			$in: function(a, b) {

				//intersecting an array
				if(b instanceof Array) {

					for(var i = b.length; i--;) {

						if(a.indexOf(b[i]) > -1) return true;

					}	

				} else {

					return a.indexOf(b) > -1;

				}

			},

			/**
			 */

			$not: function(a, b) {
				return !a.test(b);
			},

			/**
			 */

			$type: function(a, b, org) {

				//instanceof doesn't work for strings / boolean. instanceof works with inheritance
				return org ? org instanceof a || org.constructor == a : false;

			},

			/**
			 */


			$nin: function(a, b) {

				return !_testers.$in(a, b);

			},

			/**
			 */

			$mod: function(a, b) {

				return b % a[0] == a[1];

			},

			/**
			 */

			$all: function(a, b) {


				for(var i = a.length; i--;) {

					var v = a[i];

					if(b.indexOf(v) == -1) return false;

				}

				return true;

			},

			/**
			 */

			$size: function(a, b) {

				return b ? a == b.length : false;

			},

			/**
			 */

			$or: function(a, b) {

				var i = a.length, n = i;

				for(; i--;) {

					if(test(a[i], b)) {

						return true;

					}

				}

				return !n;

			},

			/**
			 */

			$nor: function(a, b) {

				var i = a.length, n = i;

				for(; i--;) {

					if(!test(a[i], b)) {

						return true;

					}

				}

				return !n;

			},

			/**
			 */

			$and: function(a, b) {

				for(var i = a.length; i--;) {

					if(!test(a[i], b)) {

						return false;

					}
				}

				return true;
			},

			/**
			 */

			$trav: function(a, b) {

				if(b instanceof Array) {
					
					for(var i = b.length; i--;) {
						
						var subb = b[i];

						if(subb[a.k] && test(a, subb[a.k])) return true;

					}

					return false;
				}


				return b ? test(a, b[a.k]) : false;

			}
		}

		var _prepare = {
			
			/**
			 */

			$eq: function(a) {
				
				var fn;

				if(a instanceof RegExp) {

					return a;

				} else if (a instanceof Function) {

					fn = a;

				} else {
					
					fn = function(b) {

						return a == b;
					}

				}

				return {

					test: fn

				}

			},
			
			/**
			 */
				
			 $ne: function(a) {
				return _prepare.$eq(a);
			 }
		};



		var _getExpr = function(type, key, value) {

			var v = _comparable(value);

			return { 

				//type
				// t: type,

				//k key
				k: key, 

				//v value
				v: _prepare[type] ? _prepare[type](v) : v, 

				//e eval
				e: _testers[type] 
			};

		}


	})();

	var sifter = function(query) {

		//build the filter for the sifter
		var filter = _queryParser.parse( query );
			
		//the function used to sift through the given array
		var self = function(target) {
				
			var sifted = [];

			//I'll typically start from the end, but in this case we need to keep the order
			//of the array the same.
			for(var i = 0, n = target.length; i < n; i++) {

				if(filter.test( target[i] )) sifted.push(target[i]);

			}

			return sifted;
		}

		//set the test function incase the sifter isn't needed
		self.test   = filter.test;
		self.query  = query;

		return self;
	}


	//sifts a given array
	var sift = function(query, target) {


		var sft = sifter(query);

		//target given? sift through it and return the filtered result
		if(target) return sft(target);

		//otherwise return the sifter func
		return sft;

	}


	//node.js?
	if((typeof module != 'undefined') && (typeof module.exports != 'undefined')) {
		
		module.exports = sift;

	} else 

	//browser?
	if(typeof window != 'undefined') {
		
		window.sift = sift;

	}

})();


});

_sardines.register("/modules/sift", function(require, module, exports, __dirname, __filename) {
	module.exports = require('modules/sift/sift.js');
});

_sardines.register("/modules/util", function(require, module, exports, __dirname, __filename) {
	// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var events = require('events');


var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      case '%%': return '%';
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
}


exports.print = function() {
  for (var i = 0, len = arguments.length; i < len; ++i) {
    process.stdout.write(String(arguments[i]));
  }
};


exports.puts = function() {
  for (var i = 0, len = arguments.length; i < len; ++i) {
    process.stdout.write(arguments[i] + '\n');
  }
};


exports.debug = function(x) {
  process.binding('stdio').writeError('DEBUG: ' + x + '\n');
};


var error = exports.error = function(x) {
  for (var i = 0, len = arguments.length; i < len; ++i) {
    process.binding('stdio').writeError(arguments[i] + '\n');
  }
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: colors ? stylizeWithColor : stylizeNoColor
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
var colors = {
   'bold' : [1, 22],
   'italic' : [3, 23],
   'underline' : [4, 24],
   'inverse' : [7, 27],
   'white' : [37, 39],
   'grey' : [90, 39],
   'black' : [30, 39],
   'blue' : [34, 39],
   'cyan' : [36, 39],
   'green' : [32, 39],
   'magenta' : [35, 39],
   'red' : [31, 39],
   'yellow' : [33, 39]
};

var styles = {
   'special': 'cyan',
   'number': 'blue',
   'boolean': 'yellow',
   'undefined': 'grey',
   'null': 'bold',
   'string': 'green',
   'date': 'magenta',
   // "name": intentionally not styling
   'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = styles[styleType];

  if (style) {
    return '\033[' + colors[style][0] + 'm' + str +
           '\033[' + colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}





function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && objectToString(re) === '[object RegExp]');
}


function isDate(d) {
  return d instanceof Date ||
    (typeof d === 'object' && objectToString(d) === '[object Date]');
}


function isError(e) {
  return e instanceof Error ||
    (typeof e === 'object' && objectToString(e) === '[object Error]');
}


function objectToString(o) {
  return Object.prototype.toString.call(o);
}


var pWarning;

exports.p = function() {
  if (!pWarning) {
    pWarning = 'util.p will be removed in future versions of Node. ' +
               'Use util.puts(util.inspect()) instead.\n';
    exports.error(pWarning);
  }
  for (var i = 0, len = arguments.length; i < len; ++i) {
    error(exports.inspect(arguments[i]));
  }
};


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


exports.log = function(msg) {
  exports.puts(timestamp() + ' - ' + msg.toString());
};


var execWarning;


exports.pump = function(readStream, writeStream, callback) {
  var callbackCalled = false;

  function call(a, b, c) {
    if (callback && !callbackCalled) {
      callback(a, b, c);
      callbackCalled = true;
    }
  }

  if (!readStream.pause) {
    readStream.pause = function() {readStream.emit('pause');};
  }

  if (!readStream.resume) {
    readStream.resume = function() {readStream.emit('resume');};
  }

  readStream.addListener('data', function(chunk) {
    if (writeStream.write(chunk) === false) readStream.pause();
  });

  writeStream.addListener('pause', function() {
    readStream.pause();
  });

  writeStream.addListener('drain', function() {
    readStream.resume();
  });

  writeStream.addListener('resume', function() {
    readStream.resume();
  });

  readStream.addListener('end', function() {
    writeStream.end();
  });

  readStream.addListener('close', function() {
    call();
  });

  readStream.addListener('error', function(err) {
    writeStream.end();
    call(err);
  });

  writeStream.addListener('error', function(err) {
    readStream.destroy();
    call(err);
  });
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be revritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

});

var entries = ["modules/daisy/index.js"],
	module = {},
	process = {
		title: 'browser'
	}

for(var i = entries.length; i--;)
{
	var entry = _sardines.require(entries[i]);

	for(var property in entry)
	{
		module[property] = entry[property];
	}
}

return module;
})();


if(typeof module != 'undefined') module.exports = __app;