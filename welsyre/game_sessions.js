var ren = require("./game_systems.js");
var Game = require('../models/player');

var exports = module.exports = {};

exports.Session = function(image_map){
	var self = {};
	self.current_players = 0;
	self.maximum_players = 6;
	self.red_team        =[];
	self.blue_team       =[];
	self.player_status   = 0;//0=searching for one more players, 1 = starting game while searching for players, 2 = full game
	self.id = null;
	self.PlayerList = {};
	self.local_socket_list= [];
	self.event_queue     =[];

	self.constructs = function(image_map){
		self.id = Math.random();
		self.sys_control = ren.System_Control();
		self.image_map = image_map;
		self.initialize_world(self.image_map);
	}

	self.initialize_world = function(){
		self.WORLD = ren.COMPONENT_INITIALIZER(self.image_map);
	}

	self.load_player = function(player, callback){
		console.log("Loading Player: "+ player.player.username);
		player.player.session = self.id;
		Game.find("player_info",{username:player.player.username}, function(err, data){
			for(var i in data[0].loadout){
				Game.find("modules", {module_id: data[0].loadout[i]}, function(err, module){
					player.loadout.push(module[0]);
				});
			}
		});
	}

	self.ConnectPlayer = function(player){
		self.PlayerList[player.username] = {
			player     : player,
			loadout    : [],
			loaded     : false,
			alive                : false,
			respawn_timer        : 600,
			current_respawn_timer: 0
		};
		self.current_players += 1;
		self.send_message(player.username+" has connected.", "SERVER");
		self.load_player(self.PlayerList[player.username]);
		self.addListener(player);
		self.create_event("player_join");
		player.socket.emit("start_game");
		ren.spawn_player(self.WORLD, self.PlayerList[player.username]);
	}

	self.RemovePlayer = function(player){
		console.log("Deleted player");
		self.WORLD.DestroyEntity(WORLD.player_to_entity[player.username]);
		delete self.PlayerList[player.username];
		self.send_message(player.username+" has disconnected.", "SERVER");
		self.current_players -= 1;
		self.create_event("player_disconnected");
	}

	self.send_current_status = function(){
		if(self.player_status == 0){
			self.send_message("Game Is Currently In Warmup", "SERVER");	
		}
		else if(self.player_status == 1){
			self.send_message("Game Has Started", "SERVER");
		}
		
	}

	self.addListener = function(player){
		player.socket.on("keyPress", function(data){
			ren.input_system(self.WORLD, data);
		});
		player.socket.on("message_server", function(data){
			self.send_message(data, player.username);
		});
	}

	self.emitters_game = function(info){
		allEnts = ren.GetAllEntities();
		for(var p in self.PlayerList){
			packet = [];
			for(var i in allEnts){
				packet.push({
					id       :allEnts[i],
					client_id    :self.WORLD.player_to_entity[self.PlayerList[p].player.username],
					image        :self.WORLD.image[allEnts[i]],
					position     :self.WORLD.position[allEnts[i]],
					stats    :{
						health: self.WORLD.health[allEnts[i]],
						shield: self.WORLD.shield[allEnts[i]]
					}
				});
			}
			self.PlayerList[p].player.socket.emit("render_packets", packet);
		}
	}

	self.send_message = function(message, from){
		for(players in self.PlayerList){
			player = self.PlayerList[players];
			player.player.socket.emit("message_client", from + ": "+message);
		}
	}

	self.update = function(dt){
		self.event_parser();
		self.game_update(dt);	

	}

	self.game_update = function(dt){
		for(players in self.PlayerList){
			ren.spawn_system(self.WORLD, self.PlayerList[players]);
		}
		for(var entities = 0; entities <= 250; entities++){
			if(self.sys_control.collision){
				ren.collision_detection_system(self.WORLD, entities);
			}
			if(self.sys_control.physics){
				ren.physics_system(self.WORLD, entities, dt);	
			}
			if(self.sys_control.movement){
				ren.movement_system(self.WORLD, entities, dt);	
			}
			if(self.sys_control.arena_bounds){
				ren.arena_bounds_system(self.WORLD, entities);
			}
			if(self.sys_control.module){
				ren.module_system(self.WORLD, entities);	
			}
			if(self.sys_control.projectile_move){
				ren.projectiles_movement_system(self.WORLD, entities, dt);	
			}
			if(self.sys_control.projectile_life){
				ren.projectiles_life_system(self.WORLD, entities);	
			}
			if(self.sys_control.bullet_hit){
				ren.bullet_hits_system(self.WORLD, entities);	
			}
			if(self.sys_control.damage){
				ren.damage_system(self.WORLD);	
			}
			if(self.sys_control.shield_damage){
				ren.shield_damage_system(self.WORLD, entities);	
			}
			if(self.sys_control.health_damage){
				ren.health_damage_system(self.WORLD, entities);	
			}
			if(self.sys_control.shield_recharge){
				ren.shield_recharge_system(self.WORLD, entities);	
			}
			
		}
		
		self.emitters_game();
	}

	self.create_event = function(type, message){
		self.event_queue.push({
			type: type,
			message: message
		})
	}

	self.reset_world = function(){
		self.initialize_world();
		for(p in self.PlayerList){
			ren.spawn_player(self.WORLD, self.PlayerList[p]);
		}
	}

	self.event_parser = function(){
		for(i in self.event_queue){
			event = self.event_queue[i];
			
			if(event.type == "player_join"){
				console.log("Session id- "+ self.id+" : Player has joined session.");
				
				if(self.current_players == self.maximum_players){
					console.log("Session id- "+ self.id+" : Game is now full.");
					self.player_status = 2;
				}else if(self.current_players < self.maximum_players && self.current_players > 1 && self.player_status == 0){
					console.log("Session id- "+ self.id+" : Game is now playable");	
					self.event_queue.push({
						type: "game_started"
					});
				}
			}else if(event.type == "player_disconnected"){
				console.log("Session id- "+ self.id+" : Player has left session.");
				if(self.current_players < 2){
					self.send_current_status();
					self.player_status = 0;
				}

			}else if(event.type == "game_started"){
				self.send_message("Game about to start, resetting world", "SERVER");
				self.reset_world();
				for(p in self.PlayerList){
					self.PlayerList[p].player.socket.emit("start_countdown");
				}
				timer = 6
				self.sys_control.physics = false;
				var timeout = setInterval(function(){
					timer--;
					if(timer == 0){
						self.sys_control.physics = true;
						clearInterval(timeout);
					}

				}, 1000);
				self.player_status = 1;
				self.send_current_status();
			}
			self.event_queue.splice(self.event_queue.indexOf(event), 1);

			for(p in self.PlayerList){
				self.PlayerList[p].player.socket.emit("server_info", {
					server_status: self.player_status
				});
			}
			
		}
	}



	self.end_session = function(){
		console.log("DEBUG: Forcing Remaining Players To Disconnect From Session");
		for(var i in self.PlayerList){
			self.PlayerList[i].player.socket.emit("disconnect_game");
			self.PlayerList[i].player.session = null;
		}
	}

	self.constructs(image_map);
	return self;
}
