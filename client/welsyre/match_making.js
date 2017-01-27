var ren = require("./game_systems.js");
var Game = require('../models/player');
var fs = require('fs');
var image_map = require('../client/assets/data.json');
//var image_map = JSON.parse(image_data);

var SOCKET_LIST = {};

var Player = function(){
	var self = {};
	self.username = null;
	self.session  = null;
	self.status = 'idle';
	self.getSession = function(){
		if(self.session != null){
			return self.session.id;
		}else{
			return null;
		}
	}
	return self;
}


var GameSession = function(){
	var self = {};
	self.id = null;
	self.PlayerList = [];
	self.local_socket_list = [];

	self.initialize_game_objects = function(callback){
		self.WORLD = ren.COMPONENT_INITIALIZER(image_map);

		self.load_players(function(err,data){
			if (err) throw err;
			
			SOCKET_LIST[self.PlayerList[0].username].emit("game_info", self.PlayerList[0].entity_id);
			SOCKET_LIST[self.PlayerList[1].username].emit("game_info", self.PlayerList[1].entity_id);
			callback(null, true);
		});
	}

	self.load_players = function(callback){
		progress = 0;
		ren.CreatePlayer(self.WORLD, self.PlayerList[0].username, 0, 300, 0, function(err, data){
			self.PlayerList[0].entity_id = data;
			ren.CreatePlayer(self.WORLD, self.PlayerList[1].username, 0,-300, 180, function(err, data){
				self.PlayerList[1].entity_id = data;
					callback(null, true)	

			});
		});
		
		
	}

	self.SessionListener = function(){
		for(var i in self.PlayerList){
			//KEYPRESS
			SOCKET_LIST[self.PlayerList[i].username].on("keyPress", function(data){
				ren.input_system(WORLD,data);
			});
		}
	}

	self.update = function(dt){
		for(var entities = 0; entities <= 250; entities++){
			ren.collision_detection_system(self.WORLD, entities);
			ren.physics_system(self.WORLD, entities, dt);
			ren.movement_system(self.WORLD, entities, dt);
			ren.arena_bounds_system(self.WORLD, entities);
			ren.module_system(self.WORLD, entities);
			ren.projectiles_movement_system(self.WORLD, entities, dt);
			ren.projectiles_life_system(self.WORLD, entities);
			ren.bullet_hits_system(self.WORLD, entities);
			ren.damage_system(self.WORLD);
			ren.shield_damage_system(self.WORLD, entities);
			ren.health_damage_system(self.WORLD, entities);
			ren.shield_recharge_system(self.WORLD, entities);
		}
		

		self.emitters();
	}

	self.getPlayerList = function(){
		return self.PlayerList;
	}
	self.ConnectPlayer = function(player){
		self.PlayerList.push(player);
	}

	self.emitters = function(info){
		allEnts = ren.GetAllEntities();
		packet = [];
		for(var i in allEnts){
			packet.push({
				id      :allEnts[i],
				image   :self.WORLD.image[allEnts[i]],
				position:self.WORLD.position[allEnts[i]],
				stats   :{
					health: self.WORLD.health[allEnts[i]],
					shield: self.WORLD.shield[allEnts[i]]
				}
			});
		}
		for(var i in self.PlayerList){
			SOCKET_LIST[self.PlayerList[i].username].emit("render_packets",packet);	
		}
	}
	self.end_session = function(callback){
		for(var i in self.PlayerList){
			//SOCKET_LIST[self.PlayerList[i].username].off("keyPress");
			SOCKET_LIST[self.PlayerList[i].username].emit("disconnect_game");
			self.PlayerList[i].session = null;
		}
		callback(self.id);
	}
	return self;
}

var Network = function(){

	var self = {};

	self.PLAYER_LIST = {};
	self.JOINING_GAMES = [];
	self.SESSION_LIST = {};

	self.newConnections = function(newsocket){
		
		newsocket.id = newsocket.request.user.username;
		console.log(newsocket.id + " has connected.");

		self.preSend(newsocket);
		PLAYER = Player();

		PLAYER.username = newsocket.id;
		SOCKET_LIST[newsocket.id] = newsocket;
		self.PLAYER_LIST[newsocket.id] = PLAYER;

		newsocket.on("cancel_matchmaking", function(){
			self.cancel_matchmaking(newsocket);
		});
		newsocket.on("find_match", function(){
			console.log("Adding "+newsocket.request.user.username+" to match making queue.")
			self.PLAYER_LIST[newsocket.request.user.username].status = "matchmaking";
			self.JOINING_GAMES.push(self.PLAYER_LIST[newsocket.id]);
		});

		newsocket.on('disconnect', function(){
			console.log(newsocket.id + " Disconnected");
			player_temp = self.PLAYER_LIST[newsocket.id]
			if(player_temp.getSession() != null){
				self.SESSION_LIST[player_temp.getSession()].end_session(self.close_session);
			}
			self.cancel_matchmaking(newsocket);
			delete SOCKET_LIST[newsocket.id];
			delete self.PLAYER_LIST[newsocket.id];
		});
	}

	self.close_session = function(id){
		console.log("Closing session "+id);
		delete self.SESSION_LIST[id]

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
	self.Update_Matchmaking = function(dt){
		if(self.JOINING_GAMES.length > 1){
			for(var i in self.JOINING_GAMES){
				console.log(self.JOINING_GAMES[i].username)
			}
			p1 = self.JOINING_GAMES[0];
			p2 = self.JOINING_GAMES[self.JOINING_GAMES.length-1];
			

			//console.log("Mix and Matching!");
			if(p1.username != p2.username){
				console.log("Matched "+p1.username+" and "+p2.username+" together.");
				self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(p1), 1);
				self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(p2), 1);

				var newGameSession = GameSession();
				newGameSession.id = Math.random();

				newGameSession.ConnectPlayer(p1);
				newGameSession.ConnectPlayer(p2);


				SOCKET_LIST[p1.username].emit("found_game", {
					opponentName: p2.username
				});
				SOCKET_LIST[p2.username].emit("found_game", {
					opponentName: p1.username
				});

				p1.session = newGameSession;
				p2.session = newGameSession;

				newGameSession.initialize_game_objects(function(err, data){
					if (err) throw err;
					SOCKET_LIST[p1.username].emit("starting_game");
					SOCKET_LIST[p2.username].emit("starting_game");
					newGameSession.SessionListener();			
					self.SESSION_LIST[newGameSession.id] = newGameSession;
				});
				//newGameSession.initialize_game_objects();
				
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