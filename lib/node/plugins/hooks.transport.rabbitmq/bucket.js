var Structr = require('structr');

module.exports = Structr({
	
	/**
	 */
	
	'__construct': function() {

		this.collection = [];

	},
	
	/**
	 */
	
	'add': function(items) {
		if(!(items instanceof Array)) items = [items];
		
		var self = this;
		
		items.forEach(function(item) {

			self.collection.push(item);
			
			if(self._dump) self._dump(item);

		});
	},
	
	/**
	 * dumps the queue
	 */
	
	'dump': function(callback) {
		
		this._dump = callback;
		
		this.collection.forEach(callback);
	}
	
});