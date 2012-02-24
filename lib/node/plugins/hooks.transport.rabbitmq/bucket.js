var Structr = require('structr'),
EventEmitter = require('events').EventEmitter;

module.exports = Structr({
	
	/**
	 */
	
	'__construct': function() {
		
		this._em = new EventEmitter();
		this._em.setMaxListeners(0);
		this.collection = [];

	},

	/**
	 */

	'on': function(type, callback) {
		this._em.on(type, callback);
	},
	
	/**
	 */
	
	'add': function(items) {
		if(!(items instanceof Array)) items = [items];
		
		var self = this;
		
		items.forEach(function(item) {

			self.collection.push(item);

			// if(self._dump) self._dump(item);

		});

		self._em.emit('hooks', items);
	},
	
	/**
	 * dumps the queue
	 */
	
	'dump': function(callback) {
		
		// this._dump = callback;
		
		this.collection.forEach(callback);
	},

	/**
	 */

	'hooks': function() {
		return this.collection;
	}
	
});