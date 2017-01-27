var exports = module.exports = {};


exports.Game = function(){
	self = {};
	self.player_list = {};
	self.initialize_game_objects = function(callback){
		self.WORLD = ren.COMPONENT_INITIALIZER(image_map);

		self.load_players(function(err,data){
			if (err) throw err;
			
			SOCKET_LIST[self.PlayerList[0].username].emit("game_info", self.PlayerList[0].entity_id);
			SOCKET_LIST[self.PlayerList[1].username].emit("game_info", self.PlayerList[1].entity_id);
			callback(null, true);
		});
	}

	self.Update_Physics = function(){
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
	}


}

