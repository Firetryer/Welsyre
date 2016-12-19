var exports = module.exports = {};
var ENTITY_COUNT = 200;
var COMPONENTS = COMPONENT();


//GLOBAL STUFFS
var WORLD = {
	mask    : new Array(ENTITY_COUNT),
	position: new Array(ENTITY_COUNT),
	velocity: new Array(ENTITY_COUNT),
	movement: new Array(ENTITY_COUNT),
	image   : new Array(ENTITY_COUNT)
}

COMPONENT_INITIALIZER();

//HELPERS
var COMPONENT_INITIALIZER = function(WORLD){
	for(var g = 0; g < ENTITY_COUNT; ++g){
		WORLD.mask[g]    = COMPONENTS.NONE;
		WORLD.position[g]= component_position();
		WORLD.velocity[g]= component_velocity();
		WORLD.movement[g]= component_movement();
		WORLD.image[g]   = component_image();
	}
}

var CreateEntity = function(WORLD){
	for(var entity = 0; entity < ENTITY_COUNT; ++entity){
		if(WORLD.mask[entity] == COMPONENTS.NONE){
			return entity;
		}
	}
	return null;
}

var DestroyEntity = function(WORLD, entity){
	WORLD.mask[entity]    = COMPONENTS.NONE;
	
}

//Creaters
var CreatePlayer = function(WORLD, x, y){
	entity = CreateEntity(WORLD);
	WORLD.mask[entity]    = COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.MOVEMENT | COMPONENTS.IMAGE;
	WORLD.position[entity].x        = 0;
	WORLD.position[entity].y        = 0;
	WORLD.position[entity].rotation = 0;
	WORLD.velocity[entity].velocity = 0;
	WORLD.image[entity].image       = 'ships';

	return entity;
}

//SYSTEMS

var physics_system = function(WORLD){
	physics_mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY | COMPONENTS.movement);
	for(var entities = 0; entities < ENTITY_COUNT; ++entities){
		if((WORLD.mask[entities] & physics_mask) == physics_mask){
			pos = WORLD.position[entities];
			vel = WORLD.velocity[entities];
			mov = WORLD.movement[entities];
			//Increases throttle
			if(mov.accelerate_forward &&  vel.velocity < vel.velocity_max){
				vel.velocity += vel.acceleration;
			//decrease throttle / reverse
			}else if(mov.accelerate_backward && vel.velocity > (vel.velocity_max * -1)){
				vel.velocity -= vel.acceleration
			//If none is being done, always slow ship back down to 0 (As if air resistence.... even though we're in space.)
			}else{
				if(vel.velocity < 0){
					vel.velocity -= vel.acceleration;
					if(vel.velocity >= 0){
						vel.velocity = 0;
					}
				}else{
					vel.velocity += vel.acceleration;
					if(vel.velocity <= 0){
						vel.velocity = 0;
					}
				}
			//Implements rotation
			}if(mov.rotate_left){
				pos.rotation += vel.rotation_speed;
				if(pos.rotation >= 360){
					pos.rotation = 0;
				}
			}if(mov.rotate_right){
				pos.rotation -= vel.rotation_speed;
				if(pos.rotation <= 0){
					pos.rotation = 359;
				}
			}//Implements MAXIMUM SPEED!!!
		}
	}
}

var movement_system = function(WORLD){
	movement_mask = (COMPONENTS.POSITION | COMPONENTS.VELOCITY);
	for(var entities = 0; entities < ENTITY_COUNT; entities ++){
		if((WORLD.mask[entities] & movement_mask) == movement_mask){
			pos = WORLD.position[entities];
			vel = WORLD.velocity[entities];

			y = Math.cos(pos.rotation * Math.PI / 180) * vel.velocity;
        	x = Math.sin(pos.rotation * Math.PI / 180) * vel.velocity;

        	pos.x += x;
        	pos.y += y;
		}
	}
}

var movement_flag_system = function(WORLD){
	flag_mask = (COMPONENTS.movement);
	for(var entities = 0; entities < ENTITY_COUNT; entities++){
		if((WORLD.mask[entities] & flag_mask) == flag_mask){
			mov = WORLD.movement;
			
		}
	}
}
// User Input > Input affects Flags > flags affect variables > variables affect sprite.
var rotate_system = function(WORLD){

}
//ALL COMPONENTS STRUCTS
var COMPONENT = function(){
	var self = this;
	self.NONE    = 0;
	self.POSITION= 1 << 0;
	self.VELOCITY= 1 << 1;
	self.MOVEMENT= 1 << 2;
	self.IMAGE   = 1 << 3;
	return self;
}

var component_position = function(){
	var self = this;
	self.x = 0;
	self.y = 0;
	self.rotation = 0;
	return self;
}

var component_velocity = function(){
	var self = this;
	self.velocity = 0;
	self.velocity_max = 80;

	self.rotation_speed = 10;
	self.acceleration = 10;
	return self;
}

var component_movement = function(){
	var self = this;
	self.accelerate_forward = false;
	self.accelerate_backward= false;
	self.rotate_left        = false;
	self.rotate_right       = false;
	return self;
}

var component_image = function(){
	var self = this;
	self.image = '';
}