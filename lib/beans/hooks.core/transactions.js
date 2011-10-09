var Structr = require('structr'),
EventEmitter = require('events').EventEmitter,
cashew = require('cashew');

var Transaction = Structr({
	
	/**
	 */

	'__construct': function(name, id, collection)
	{
		this._name = name;
		this._id = id;
		this._collection = collection;
		
		this._em = new EventEmitter();
	},
	
	/**
	 */
	
	'emit': function(type, data)
	{
		this._em.emit(type, data);
	},
	
	
	/**
	 */

	'send': function(type, request)
	{
		var self = this;
		
		if(request.hasNext())
		{
			this.register();
			
			this._em.on('next', function()
			{
				request.next();
			})
		}
		
		var headers = { type: type, 
			hasNext: request.hasNext(), 
			transactionId: this._id };
		
		
		this._collection._transport.broadcast(this._name, request.data, headers);

		return this;
	},
	
	/**
	 */

	/*'response': function(message)
	{
		this._em.emit(message.action, message.data);
		return this;
	},*/

	/**
	 */

	'on': function(listen)
	{
		for(var type in listen)
		{
			this.on(type, listen[type])
		}

		return this;
	},

	/**
	 */

	'second on': function(type, listener)
	{
		this._em.addListener(type, listener);
		return this;
	},

	/**
	 */

	'register': function()
	{
		this._collection._addTransaction(this);	
		return this;
	},

	/**
	 */

	'onError': function(e)
	{
		this._em.emit('error', e);
	},

	/**
	 */

	'dispose': function()
	{
		this._em.removeAllListeners();

		this._collection.remove(this._uid);
	}
});



module.exports = Structr({

	/**
	 */

	'__construct': function(transport)
	{
		this._live = {};
		this._transport = transport;
		
        this._idGen = cashew.register('hook.core');
	},
	
	/**
	 */
	
	'create': function(name)
	{
		return new Transaction(name, this._idGen.uid(), this);
	},

	/**
	 */
	
	'remove': function(uid)
	{
		var trans = this._live[uid];
		delete this._live[uid];
		return trans;
	},
	
	/**
	 */
	
	'live': function(uid)
	{
		return this._live[uid];
	},

	/**
	 */

	'_addTransaction': function(trans)
	{		
		this._live[ trans._id ] = trans;
	}
	
});