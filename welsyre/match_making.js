var ren = require("./game_systems.js");
var Game = require('../models/player');
var image_map = require('../client/assets/data.json');
var game_session = require("./game_sessions.js");
var SOCKET_LIST = {};

var Player = function(){
	var self = {};
	self.username     = null;
	self.session      = null;
	self.socket       = null;
	self.status       = 'idle';

	self.getSession = function(){
		if(self.session != null){
			return self.session;
		}else{
			return null;
		}
	}
	return self;
}

var Network = function(){

	var self = {};

	self.PLAYER_LIST = {};
	self.JOINING_GAMES = [];
	self.SESSION_LIST = {};
	self.SESSION_QUEUE= {};

	self.newConnections = function(newsocket){
		newsocket.id = newsocket.request.user.username;
		console.log(newsocket.id + " has connected.");
		self.preSend(newsocket);

		PLAYER = Player();
		PLAYER.username = newsocket.id;
		PLAYER.socket   = newsocket;

		SOCKET_LIST[newsocket.id] = newsocket;
		self.PLAYER_LIST[newsocket.id] = PLAYER;

		newsocket.on("cancel_matchmaking", function(){
			self.cancel_matchmaking(newsocket);
		});
		newsocket.on("find_match", function(){
			console.log("Adding "+newsocket.request.user.username+" to match making queue.")
			self.PLAYER_LIST[newsocket.id].status = "matchmaking";
			self.JOINING_GAMES.push(self.PLAYER_LIST[newsocket.id]);
		});

		newsocket.on('disconnect', function(){
			console.log(newsocket.id + " Disconnected");
			player_temp = self.PLAYER_LIST[newsocket.id]
			if(player_temp.getSession() != null){
				console.log("DEBUG: Player was part of session. Removing player from session");
				self.SESSION_LIST[player_temp.getSession()].RemovePlayer(player_temp);
				if(self.SESSION_LIST[player_temp.getSession()].current_players == 0){
					console.log("DEBUG: Session now empty, deleting session.");
					self.close_session(player_temp.getSession());
				}
			}
			//self.cancel_matchmaking(newsocket);
			delete SOCKET_LIST[newsocket.id];
			delete self.PLAYER_LIST[newsocket.id];
		});
	}

	self.close_session = function(id, reason){
		self.SESSION_LIST[id].end_session();
		console.log("DEBUG: Deleting Session From SESSION_LIST");
		delete self.SESSION_LIST[id];
	}

	self.cancel_matchmaking = function(socket){
		if(self.PLAYER_LIST[socket.id].status == "matchmaking" ){
			self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(self.PLAYER_LIST[socket.id]), 1);
		}
	}
	self.preSend = function(socket){
		//First Batch: Stats
		Game.find("player_info",{username: socket.request.user.username}, function(err, data){
			packet = {
				name    : data[0].username,
				level   : data[0].level,
				xp      : data[0].xp
			}
			socket.emit("initialization", packet);
		});
		//Second Batch: Current Loadout
	}
	self.MatchMaking = function(){
		if(self.JOINING_GAMES.length > 0){
			for(i in self.JOINING_GAMES){
				user = self.JOINING_GAMES[i];
				if(Object.keys(self.SESSION_LIST).length > 0){
					for(i in self.SESSION_LIST){
						session = self.SESSION_LIST[i];
						if(session.player_status == 1){
							console.log("Added "+user.username+" to existing match.")
							session.ConnectPlayer(user);
							self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(user), 1);
							continue;
						}else if(session.player_status == 0){
							console.log("Added "+user.username+" to a pending match")
							session.ConnectPlayer(user);
							self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(user), 1);
							continue;
						}else{
							continue;
						}
					}
				}else{
					console.log(Object.keys(self.SESSION_LIST).length);
					console.log("Created new session for "+user.username)
					new_session = game_session.Session(image_map);
					new_session.ConnectPlayer(user);
					new_session.send_message("Waiting for more players to join game.","SERVER");
					self.SESSION_LIST[new_session.id] = new_session;
					self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(user), 1);
				}
			}
		}
	}

	self.Update_Game = function(dt){
		for(var i in self.SESSION_LIST){
			self.SESSION_LIST[i].update(dt);
		}
	}
	return self;
}

module.exports = Network();