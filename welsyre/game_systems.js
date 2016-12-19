var exports = module.exports = {};
var comp = require("./entity_components.js");
var ENTITY_COUNT = 400;

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
	COLLISION : 1 << 9
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
		collision  : new Array(ENTITY_COUNT)
	}	
	for(var g = 0; g < ENTITY_COUNT; g++){
		WORLD.mask[g]        = COMPONENTS.NONE;
		WORLD.position[g]    = comp.position();
		WORLD.velocity[g]    = comp.velocity();
		WORLD.movement[g]    = comp.movement();
		WORLD.image[g]       = comp.image();
		WORLD.modules[g]     = comp.ship_modules();
		WORLD.projectile[g] = comp.projectile();
		WORLD.container[g]   = comp.container();
		WORLD.weapon[g]      = comp.weapon();
		WORLD.range[g]       = comp.range();
		WORLD.collision[g]   = comp.collision();
	}
	WORLD.image_properties = col_masks
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

//Creaters
exports.CreatePlayer = function(WORLD, x, y){
	entity = CreateEntity(WORLD);
	WORLD.mask[entity]    = COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.MOVEMENT | COMPONENTS.IMAGE | COMPONENTS.CONTAINER | COMPONENTS.MODULES | COMPONENTS.COLLISION;
	WORLD.position[entity].x              = x;
	WORLD.position[entity].y              = y;
	WORLD.position[entity].rotation       = 0;
	WORLD.velocity[entity].velocity       = 0;
	WORLD.container[entity].module_slot01 = create_ranged_weapon(WORLD, entity);
	create_image(WORLD, entity, "ship_standard");
	
	return entity;
}

var create_image = function(WORLD, entity, name){
	WORLD.image[entity].image             = WORLD.image_properties[name].name;
	WORLD.image[entity].width             = WORLD.image_properties[name].height;
	WORLD.image[entity].height            = WORLD.image_properties[name].width;
	console.log(WORLD.image[entity]);
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
	
	WORLD.collision[entity].collision_target  = null;
	WORLD.position[entity].x        		  = WORLD.position[parent_id].x;
	WORLD.position[entity].y        		  = WORLD.position[parent_id].y;
	WORLD.position[entity].rotation 		  = WORLD.position[parent_id].rotation;
	WORLD.velocity[entity].velocity      	  = 620;
	WORLD.velocity[entity].velocity_max 	  = 620;
	WORLD.projectile[entity]                  = comp.projectile();
	WORLD.projectile[entity].parent_id        = parent_id;
	WORLD.image[entity].image                 = "laser";
	return entity;
}

//SYSTEMS////////////////////////////////////////////////////////////////////////////////////////////////////////
//SYSTEMS////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.physics_system = function(WORLD, dt){
	physics_mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.MOVEMENT);
	for(var entities = 0; entities < ENTITY_COUNT; ++entities){
		if((WORLD.mask[entities] & physics_mask) == physics_mask){
			pos = WORLD.position[entities];
			vel = WORLD.velocity[entities];
			mov = WORLD.movement[entities];
			//Increases throttle
			if(mov.accelerate_forward){
				vel.velocity += vel.vel_acceleration;
			//decrease throttle / reverse
			}else if(mov.accelerate_backward){
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

			if(vel.velocity >= vel.velocity_max){
				vel.velocity = vel.velocity_max;
			}else if(vel.velocity <= vel.velocity_max * -0.5){
				vel.velocity = vel.velocity_max * -0.5;
			}
		}
	}
}

exports.movement_system = function(WORLD, dt){
	movement_mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY);
	for(var entities = 0; entities < ENTITY_COUNT; entities ++){
		if((WORLD.mask[entities] & movement_mask) == movement_mask){
			pos = WORLD.position[entities];
			vel = WORLD.velocity[entities];

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
		}
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

exports.projectiles_movement_system = function(WORLD, dt){
	projectile_mask = (COMPONENTS.PROJECTILE);
	for(var entities = 0; entities < ENTITY_COUNT; entities ++){
		if((WORLD.mask[entities] & projectile_mask) == projectile_mask){
			pos = WORLD.position[entities];
			vel = WORLD.velocity[entities];

			y = Math.cos(pos.rotation * Math.PI / 180) * vel.velocity;
        	x = Math.sin(pos.rotation * Math.PI / 180) * vel.velocity;
        	pos.x += x * dt;
        	pos.y += y * dt;
		}
	}
}

exports.projectiles_life_system = function(WORLD){
	projectile_mask = (COMPONENTS.PROJECTILE);
	for(var entities = 0; entities < ENTITY_COUNT; entities ++){
		if((WORLD.mask[entities] & projectile_mask) == projectile_mask){
			pro = WORLD.projectile[entities];

			if(pro.spawn >= pro.life_span){
				DestroyEntity(WORLD,entities);
				console.log("PROJECTILE ENTITY KILLED");
			}else{
				pro.spawn += 1;
			}
		}
	}
}

exports.collision_detection_system = function(WORLD){
	collision_masks = (COMPONENTS.COLLISION);
	for(var ent1 = 0; ent1 < ENTITY_COUNT; ent1++){
		if((WORLD.mask[ent1] & collision_masks) == collision_masks){
			for(var ent2 = 0; ent2 < ENTITY_COUNT; ent2 ++){
				if(ent1 != ent2){
					entity1_dimensions = WORLD.image[ent1];
					entity2_dimensions = WORLD.image[ent2];
					entity1_pos        = WORLD.position[ent1];
					entity2_pos        = WORLD.position[ent2];
					if(check_bounding_collision(entity1_pos, entity2_pos, entity1_dimensions, entity2_dimensions)){
						WORLD.collision[ent1].collision_target = ent2;
						WORLD.collision[ent2].collision_target = ent1;
					}
				}
			}
		}
	}
}

exports.bullet_hits_system = function(WORLD){
	projectile_masks = (COMPONENTS.PROJECTILE);
	for(var entity = 0; entity < ENTITY_COUNT; entity++){
		if((WORLD.mask[entity] & projectile_masks) == projectile_masks){
			if(WORLD.collision[entity].collision_target != WORLD.projectile[entity].parent_id){
				console.log(WORLD.collision[entity].collision_target+ " ====" + WORLD.projectile[entity].parent_id);
				DestroyEntity(WORLD, entity);
			}
		}
	}
}

var check_bounding_collision = function(ent1_pos, ent2_pos, ent1_dimensions, ent2_dimensions){
	if (ent1_pos.x < ent2_pos.x + ent2_dimensions.width  && ent1_pos.x + ent1_dimensions.width  > ent2_pos.x &&
		ent1_pos.y < ent2_pos.y + ent2_dimensions.height && ent1_pos.y + ent1_dimensions.height > ent2_pos.y) {
		return true;
	}else{
		return false;
	}
}

exports.module_system = function(WORLD, dt){
	player_mask = (COMPONENTS.CONTAINER | COMPONENTS.MODULES);
	for(var entities = 0; entities < ENTITY_COUNT; entities ++){
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

