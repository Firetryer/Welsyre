var mongoose = require('mongoose');

//User Schema
var PlayerSchema = mongoose.Schema({
	username: {
		type: String,
		index:true
	},
	level: {
		type: Number, default: 1
	},
	xp   : {
		type: Number, default: 0
	},
	loadout: {
		type: Array, default: []
	}
}, {collection: "player_info"});

var Player = module.exports = mongoose.model('player_info', PlayerSchema);

module.exports.createUser = function(newUser, callback){
	newUser.loadout = ['DST1','OCT1']
	newUser.save(callback);
}


module.exports.find = function(collec, query, callback) {
    mongoose.connection.db.collection(collec, function (err, collection) {
    	collection.find(query).toArray(callback);
    });
}