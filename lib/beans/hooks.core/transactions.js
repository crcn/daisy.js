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

	'send': function(type, ops)
	{
		var self = this;
		
		if(ops.hasNext && ops.hasNext())
		{
			this.register();
			
			this._em.on('next', ops.next);
		}
		
		var meta = ops.meta || {};
		
		//undefined breaks amqp
		for(var key in meta) if(!meta[key]) meta[key] = 1;
		
		var headers = { type: type, 
			hasNext: ops.hasNext ? ops.hasNext() : false, 
			transactionId: this._id,     
			channel: this._name,
			meta: meta }; 
			
		if(!ops.queue) ops.queue = meta.queue;
		                           
		                  
		
		if(ops.queue)
		{                            
			this._collection._transport.direct(ops.queue, ops.data, headers);
		}              
		else
		{                            
			this._collection._transport.broadcast(this._name, ops.data, headers);
		}                                                                           

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

		this._collection.remove(this);
	}
});



module.exports = Structr({

	/**
	 */

	'__construct': function(transport)
	{
		this._live = {};
		this._liveByChannel = {};
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
	
	'remove': function(trans)
	{
		
		if(this._live[trans._id])
		{
			delete this._live[trans._id];
			var index = this._liveByChannel[trans._name].indexOf(trans);
			this._liveByChannel[trans._name].splice(index, 1);
			if(!this._liveByChannel[trans._name].length) delete this._liveByChannel[trans._name];
		}
		
		return trans;
	},
	
	/**
	 */
	
	'live': function(uidOrChannel)
	{
		return this._live[uidOrChannel] || this._liveByChannel[ uidOrChannel ];
	},

	/**
	 */

	'_addTransaction': function(trans)
	{		
		this._live[ trans._id ] = trans;
		if(!this._liveByChannel[ trans._name ]) this._liveByChannel[ trans._name ] = [];
		
		this._liveByChannel[ trans._name ].push(trans);
	}
	
});