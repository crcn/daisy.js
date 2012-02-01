var Structr = require('structr'),
EventEmitter = require('events').EventEmitter,
cashew = require('cashew');

var Transaction = Structr({
	
	/**
	 */

	'__construct': function(name, id, collection) {

		this._name = name;
		this._id = id;
		this._collection = collection;
		
		this._em = new EventEmitter();
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
			channel: this._name,
			tags: tags }; 
			                                       
		this._queue = ops.queue || tags.queue;    
		this._payload  = ops.payload;

		
		return this;
	},  
	
	/**
	 */
	
	'send': function() {

		if(this._queue) {   
		                         
			this._collection._transport.direct(this._queue, this._payload, this._headers);

		} else { 
		                           
			this._collection._transport.broadcast(this._name, this._payload, this._headers);
		}
		
		return this;                                                                           
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
		console.error('Transaction %s has been killed - id: ', this._headers.channel, this._id);
		this._em.emit('response', { error: new Error('Transaction '+this._headers.channel+' timeout') });
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
		this._liveByChannel = new Collection();   
        this._idGen 		= cashew.register('hook.core');
	},
	
	/**
	 */
	
	'create': function(name) {

		return new Transaction(name, this._idGen.uid(), this);

	},

	
	/**
	 */
	
	'live': function(uidOrChannelOrQueue) { 
	                                           
		return this._live[ uidOrChannelOrQueue ] || this._liveByChannel.stack(uidOrChannelOrQueue) || this._liveByQueue.stack(uidOrChannelOrQueue);
	
	},

	/**
	 */

	'_addTransaction': function(trans) {

		if(this._live[ trans._id ]) return false;		                 
	            
		this._live[ trans._id ] = trans;                                    
		this._liveByChannel.add(trans._name, trans);
		this._liveByQueue.add(trans._queue, trans);

		return true;
	},


	/**
	 */
	
	'_remove': function(trans) {   
	                      
		if(this._live[trans._id]) {

			delete this._live[trans._id];   
			
			this._liveByChannel.remove(trans._name, trans); 
			this._liveByQueue.remove(trans._queue, trans);  
			                                        
		}
		
		return trans;
	}
	
});