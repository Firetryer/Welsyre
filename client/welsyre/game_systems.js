var exports = module.exports = {};
var Game = require('../models/player');
var comp = require("./entity_components.js");
var ENTITY_COUNT = 250;
var HITBOX_OFFSET = 0.3;
//HELPERS
var COMPONENTS = {
	NONE      : 0,
	POSITION  : 1 << 0,
	VELOCITY  : 1 << 1,
	MOVEMENT  : 1 << 2,
	IMAGE     : 1 << 3,
	MODULES   : 1 << 4,
	PROJECTILE: 1 << 5,
	CONTAINER : 1 << 6,
	WEAPON    : 1 << 7,
	RANGE     : 1 << 8,
	COLLISION : 1 << 9,
	HEALTH    : 1 << 10,
	SHIELD    : 1 << 11
}

exports.COMPONENT_INITIALIZER = function(col_masks){
	WORLD = {
		mask       : new Array(ENTITY_COUNT),
		position   : new Array(ENTITY_COUNT),
		velocity   : new Array(ENTITY_COUNT),
		movement   : new Array(ENTITY_COUNT),
		image      : new Array(ENTITY_COUNT),
		modules    : new Array(ENTITY_COUNT),
		projectile : new Array(ENTITY_COUNT),
		container  : new Array(ENTITY_COUNT),
		weapon     : new Array(ENTITY_COUNT),
		range      : new Array(ENTITY_COUNT),
		collision  : new Array(ENTITY_COUNT),
		health     : new Array(ENTITY_COUNT),
		shield     : new Array(ENTITY_COUNT)
	}	
	WORLD.image_properties = col_masks;
	WORLD.damage_stack     = [];
	for(var g = 0; g < ENTITY_COUNT; g++){
		WORLD.mask[g]        = COMPONENTS.NONE;
		WORLD.position[g]    = comp.position();
		WORLD.velocity[g]    = comp.velocity();
		WORLD.movement[g]    = comp.movement();
		WORLD.image[g]       = comp.image();
		WORLD.modules[g]     = comp.ship_modules();
		WORLD.projectile[g]  = comp.projectile();
		WORLD.container[g]   = comp.container();
		WORLD.weapon[g]      = comp.weapon();
		WORLD.range[g]       = comp.range();
		WORLD.collision[g]   = comp.collision();
		WORLD.health[g]      = comp.health();
		WORLD.shield[g]      = comp.shield();
	}
	
	return WORLD
}

var CreateEntity = function(WORLD){
	for(var entity = 0; entity < ENTITY_COUNT; ++entity){
		if(WORLD.mask[entity] == COMPONENTS.NONE){
			return entity;
		}
	}
	console.log("NO MORE FREE ENTITY SLOTS")
	return null;
}


var DestroyEntity = function(WORLD, entity){
	WORLD.mask[entity]    = COMPONENTS.NONE;
}

exports.GetAllEntities = function(){
	entityList = []
	renderable_mask = (COMPONENTS.POSITION, COMPONENTS.IMAGE);
	for(var i =0; i<ENTITY_COUNT; i++){
		if((WORLD.mask[i] & renderable_mask) == renderable_mask){
			entityList.push(i);
		}
	}
	return entityList;
}


/*exports.CreatePlayer = function(WORLD, x, y, health){
	entity = CreateEntity(WORLD);
	WORLD.mask[entity]    = COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.MOVEMENT | COMPONENTS.IMAGE | COMPONENTS.CONTAINER | COMPONENTS.MODULES | COMPONENTS.COLLISION;
	WORLD.position[entity].x              = x;
	WORLD.position[entity].y              = y;
	WORLD.position[entity].rotation       = 0;
	WORLD.velocity[entity].velocity       = 0;
	WORLD.health[entity].health           = health;
	WORLD.container[entity].module_slot01 = create_ranged_weapon(WORLD, entity);
	create_image(WORLD, entity, "ship_standard");
	
	return entity;
}*/


exports.CreatePlayer = function(WORLD, username, x, y, rot, callback){
	
	Game.find("player_info",{username:username}, function(err, data){
		if (err) console.log(err);
		entity = CreateEntity(WORLD);
		WORLD.mask[entity] = COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.MOVEMENT | COMPONENTS.IMAGE | COMPONENTS.CONTAINER | COMPONENTS.MODULES | COMPONENTS.COLLISION | COMPONENTS.HEALTH;
		WORLD.position[entity].x              = x;
		WORLD.position[entity].y              = y;
		WORLD.position[entity].rotation       = rot;
		WORLD.velocity[entity].velocity       = 0;
		WORLD.health[entity].health           = 150;
		WORLD.container[entity].module_slot01 = create_ranged_weapon(WORLD, entity);
		create_image(WORLD, entity, "ship_standard");
		max = data[0].loadout.length;
		cur = 0;
		for(i in data[0].loadout){
			Game.find("modules", {module_id: data[0].loadout[i]}, function(err, data){
				addModule(WORLD, entity, data[0]);
				cur += 1;
				console.log(cur + " / " + max);
				if(cur == max){
					cur = 0;
					callback(null, entity);
				}
			});
		}
	});
}

var addModule = function(WORLD, entity_id, module){
	if(module.type == "SHIELD"){
		console.log("added shield to "+ entity_id);
		WORLD.mask[entity_id] += COMPONENTS.SHIELD;
		WORLD.shield[entity_id].name                        = module.name;
		WORLD.shield[entity_id].stats                	    = module.stats;
		WORLD.shield[entity_id].stats.current_shield        = module.stats.max_shield;
		WORLD.shield[entity_id].stats.recharge_time_current = 0;
	}
}

var create_image = function(WORLD, entity, name){
	image = WORLD.image[entity];
	image.image             = WORLD.image_properties[name].name;
	image.width             = WORLD.image_properties[name].height;
	image.height            = WORLD.image_properties[name].width;
	image.radius			= image.width / 2;
}

var create_ranged_weapon = function(WORLD, parent_id){
	id = CreateEntity(WORLD);
	WORLD.mask[id]    = COMPONENTS.WEAPON | COMPONENTS.RANGE;
	WORLD.weapon[id].parent_id = parent_id;
	return id;
}

var create_projectile = function(WORLD, parent_id){
	entity = CreateEntity(WORLD);
	WORLD.mask[entity]    = COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.IMAGE | COMPONENTS.PROJECTILE | COMPONENTS.COLLISION;
	
	WORLD.collision[entity]                   = comp.collision();
	WORLD.position[entity].x        		  = WORLD.position[parent_id].x;
	WORLD.position[entity].y        		  = WORLD.position[parent_id].y;
	WORLD.position[entity].rotation 		  = WORLD.position[parent_id].rotation;
	WORLD.velocity[entity].velocity      	  = 620;
	WORLD.velocity[entity].velocity_max 	  = 620;
	WORLD.projectile[entity]                  = comp.projectile();
	WORLD.projectile[entity].parent_id        = parent_id;
	create_image(WORLD, entity, "bullet");
	return entity;
}

//SYSTEMS////////////////////////////////////////////////////////////////////////////////////////////////////////
//SYSTEMS////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.physics_system = function(WORLD, entities, dt){
	physics_mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.MOVEMENT);
	if((WORLD.mask[entities] & physics_mask) == physics_mask){

		pos = WORLD.position[entities];
		vel = WORLD.velocity[entities];
		mov = WORLD.movement[entities];
		//Increases throttle
		if(mov.accelerate_forward && !(vel.velocity >= vel.velocity_max)){
			vel.velocity += vel.vel_acceleration;
		//decrease throttle / reverse
		}else if(mov.accelerate_backward && vel.velocity > 0){
			vel.velocity -= vel.vel_acceleration / 2
		}else{
			if(vel.velocity < 0){
				vel.velocity += vel.vel_acceleration /2;
				if(vel.velocity >= 0){
					vel.velocity = 0;
				}
			}else{
				vel.velocity -= vel.vel_acceleration / 4; 
				if(vel.velocity <= 0){
					vel.velocity = 0;
				}
			}
		}
		if(mov.rotate_left){
			vel.rot_velocity += vel.rot_acceleration;
			
		}else if(mov.rotate_right){
			vel.rot_velocity -= vel.rot_acceleration;
		}else{
			if(vel.rot_velocity < 0){
				vel.rot_velocity += vel.rot_acceleration / 1.2;
				if(vel.rot_velocity >= 0){
					vel.rot_velocity = 0
				}
			}else if(vel.rot_velocity > 0){
				vel.rot_velocity -= vel.rot_acceleration / 1.2;
				if(vel.rot_velocity <= 0){
					vel.rot_velocity = 0;
				}
			}
		}

		if(vel.rot_velocity >= vel.rot_max){
			vel.rot_velocity = vel.rot_max;
		}else if(vel.rot_velocity <= vel.rot_max * -1){
			vel.rot_velocity = vel.rot_max * -1;
		}
	}
}

exports.movement_system = function(WORLD, entities, dt){
	movement_mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY);
	if((WORLD.mask[entities] & movement_mask) == movement_mask){
		pos = WORLD.position[entities];
		pos.old_x = pos.x;
		pos.old_y = pos.y;
		vel = WORLD.velocity[entities];
		img = WORLD.image[entities];

		pos.rotation += vel.rot_velocity * dt;
		if(pos.rotation > 360){
			pos.rotation = 0;
		}if(pos.rotation < 0){
			pos.rotation = 359;
		}
		y = Math.cos(pos.rotation * Math.PI / 180) * vel.velocity;
    	x = Math.sin(pos.rotation * Math.PI / 180) * vel.velocity;
    	pos.x += x * dt;
    	pos.y += y * dt;
    	pos.center_x = pos.x + img.width / 2;
    	pos.center_y = pos.y + img.height / 2;
	}
}

exports.arena_bounds_system = function(WORLD, entities){
	mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY)
	if((WORLD.mask[entities] & mask) == mask){
		pos = WORLD.position[entities];
		img = WORLD.image[entities];
		if(!within_arena(pos, img) && (WORLD.mask[entities] & COMPONENTS.PROJECTILE) != COMPONENTS.PROJECTILE){
			if(vel.velocity > 0){
				vel.velocity = -vel.velocity_max;
			}else{
				vel.velocity =  vel.velocity_max;
			}
    		
    	}
	}
}
var within_arena = function(ent ,img){
	if(Math.pow(ent.center_x-0,2) + Math.pow(ent.center_y-0, 2) > Math.pow(900, 2)){
		return false;
	}else{

		return true;
	}
}
exports.input_system = function(WORLD, data){
	
	if(data.KEY === "W")
		WORLD.movement[data.id].accelerate_forward = data.isPressed;
	if(data.KEY === "S")
		WORLD.movement[data.id].accelerate_backward= data.isPressed;
	if(data.KEY === "A")
		WORLD.movement[data.id].rotate_left        = data.isPressed;
	if(data.KEY === "D")
		WORLD.movement[data.id].rotate_right       = data.isPressed;

	if(data.KEY ==="SPACE")
		WORLD.modules[data.id].primary             = data.isPressed;

}

exports.projectiles_movement_system = function(WORLD, entities, dt){
	projectile_mask = (COMPONENTS.PROJECTILE);
	if((WORLD.mask[entities] & projectile_mask) == projectile_mask){
		pos = WORLD.position[entities];
		vel = WORLD.velocity[entities];

		y = Math.cos(pos.rotation * Math.PI / 180) * vel.velocity;
    	x = Math.sin(pos.rotation * Math.PI / 180) * vel.velocity;
    	pos.x += x * dt;
    	pos.y += y * dt;
	}
}

exports.projectiles_life_system = function(WORLD, entities){
	projectile_mask = (COMPONENTS.PROJECTILE);
	if((WORLD.mask[entities] & projectile_mask) == projectile_mask){
		pro = WORLD.projectile[entities];

		if(pro.spawn >= pro.life_span){
			DestroyEntity(WORLD,entities);
		}else{
			pro.spawn += 1;
		}
	}
}


exports.collision_detection_system = function(WORLD, ent1){
	collision_masks = (COMPONENTS.COLLISION);
	if((WORLD.mask[ent1] & collision_masks) == collision_masks){
		for(var ent2 = 0; ent2 < ENTITY_COUNT; ent2++){
			if((WORLD.mask[ent2] & collision_masks) == collision_masks){
				if(ent1 != ent2){
					image1   = WORLD.image[ent1];
					image2   = WORLD.image[ent2];
					entity1  = WORLD.position[ent1];
					entity2  = WORLD.position[ent2];
					if(check_circle_collision(WORLD, entity1, entity2, image1, image2)){
						WORLD.collision[ent1].collision_target = ent2;
						WORLD.collision[ent2].collision_target = ent1;
					}					
				}
			}
		}
	}
}
var check_circle_collision = function(WORLD, ent1, ent2, image1, image2){
	if(Math.pow(ent2.center_x-ent1.center_x, 2) + Math.pow(ent1.center_y-ent2.center_y, 2) <= Math.pow(image1.radius+image2.radius,2)){
		return true;

	}else{
		return false;
	}
}

exports.bullet_hits_system = function(WORLD, entity){
	projectile_masks = (COMPONENTS.PROJECTILE);
	if((WORLD.mask[entity] & projectile_masks) == projectile_masks){
		if(WORLD.collision[entity].collision_target != WORLD.projectile[entity].parent_id 
			&& WORLD.collision[entity].collision_target != null 
			&& (WORLD.mask[WORLD.collision[entity].collision_target] & projectile_masks) != projectile_masks){
			target = WORLD.collision[entity].collision_target;
			WORLD.damage_stack.push([target, WORLD.projectile[entity].damage]);
			DestroyEntity(WORLD, entity);
		}
	}
}

exports.damage_system = function(WORLD){
	for(events in WORLD.damage_stack){
		id     = WORLD.damage_stack[events][0];
		damage = WORLD.damage_stack[events][1];
		if((WORLD.mask[id] & COMPONENTS.SHIELD) == COMPONENTS.SHIELD && WORLD.shield[id].stats.current_shield > 0){
			//console.log(id+" Was damaged, hitting their shields.");
			WORLD.shield[id].take_damage.push(damage);
		}else{
			//console.log(id+" Was damaged, hitting their hull.")
			WORLD.health[id].take_damage.push(damage);
		}
		WORLD.damage_stack.splice(0,1);
	}
}

exports.health_damage_system = function(WORLD, entities){
	if((WORLD.mask[entities] & COMPONENTS.HEALTH) == COMPONENTS.HEALTH){
		health = WORLD.health[entities];
		if(health.take_damage.length > 0){
			health.stats.current_health -= health.take_damage[0];
			health.take_damage.splice(0,1);
		}
	}
}

exports.shield_damage_system = function(WORLD, entities){
	if((WORLD.mask[entities] & COMPONENTS.SHIELD) == COMPONENTS.SHIELD){
		shield = WORLD.shield[entities];
		if(shield.take_damage.length > 0){
			shield.stats.current_shield -= shield.take_damage[0];
			shield.stats.recharge_time_current = 0;
			if(shield.stats.current_shield < 0){
				shield.stats.current_shield = 0;
			}
			shield.take_damage.splice(0,1);
		}
	}
}

exports.shield_recharge_system = function(WORLD, entities){
	if((WORLD.mask[entities] & COMPONENTS.SHIELD) == COMPONENTS.SHIELD){
		shield = WORLD.shield[entities];
		if(shield.stats.current_shield < shield.stats.max_shield){
			if(shield.stats.recharge_time == shield.stats.recharge_time_current){
				shield.stats.current_shield += shield.stats.recharge_rate;
				if(shield.stats.current_shield > shield.stats.max_shield){
					shield.stats.current_shield = shield.stats.max_shield;
				}
			}else{
				shield.stats.recharge_time_current += 1;
			}
		}
	}
}

exports.module_system = function(WORLD, entities, dt){
	player_mask = (COMPONENTS.CONTAINER | COMPONENTS.MODULES);
	if((WORLD.mask[entities] & player_mask) == player_mask){
		mod = WORLD.modules[entities];
		con = WORLD.container[entities];
		slot1 = WORLD.weapon[con.module_slot01];

		if(mod.primary == true){
			if(slot1.cooldown_current >= slot1.cooldown_between_shots){
				activate_module(WORLD, entities);
				slot1.cooldown_current = 0;	
			}else{
				slot1.cooldown_current += 1;
			}
		}
	}
}

//Examples. If a projectile has a scatter component that makes it multiply. Create a scatter system.
var activate_module = function(WORLD, entity_id){
	ranged_mask = (COMPONENTS.WEAPON | COMPONENTS.RANGE);
	module = WORLD.mask[WORLD.container[entity_id].module_slot01];
	if((module & ranged_mask) == ranged_mask){
		wea = WORLD.weapon[WORLD.container[entity_id].module_slot01];
		create_projectile(WORLD, entity_id);
	}
}

//FIX UP THE VERY BAD MODULE SYSTEM. MAKE IT EASIER TO CREATE MORE CUSTOM MODULES
//WORK ON COLLISION HANDLING. JUST CREATE A NEW COMPONENT CALLED COLLISION.... OR SOMETHING.
//COLLISION COMPONENT COULD HAVE A CUSTOM FUNCTION TO TELL IT WHAT TO DO WHEN IT COLLIDES WITH SOMETHING.
//THE COLLISION SYSTEM COULD GIVE THE CUSTOM FUNCTION SOME INFO ABOUT WHAT IT COLLIDED WITH.
//START IMPLEMENTING HEALTH BAR/SHIELDS AND THEN ADD SOME GUI TO THE CLIENT SIDE GAME

