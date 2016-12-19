var exports = module.exports = {};

exports.image = function(){
	var self = {};
	self.image = null;
	self.width = null;
	self.height= null;
	return self;
}
exports.position = function(){
	var self = {};
	self.x = 0;
	self.y = 0;
	self.rotation = 0;
	return self;
}
exports.velocity = function(){ //Physics related component
	var self = {};
	self.velocity = 0;
	self.velocity_max   = 460;
	self.vel_acceleration   = 10;     //for velocity
	self.rot_velocity = 0;
	self.rot_max = 260;
	self.rot_acceleration = 20;
	return self;
}
exports.movement = function(){  //Flags for checking if keys for movement has been activated
	var self = {};
	self.accelerate_forward = false;
	self.accelerate_backward= false;
	self.rotate_left        = false;
	self.rotate_right       = false;
	return self;
}
exports.ship_modules = function(){//Flags for checking if keys for a ship module has been activated
	var self = {}
	self.primary   = false;
	self.secondary = false;
	self.first     = false;
	self.second    = false;
	self.third     = false;
	return self;
}


exports.container = function(){
	var self = {};
	self.module_slot01 = null;
	self.module_slot02 = null;
	self.module_slot03 = null;
	self.module_slot04 = null;
	self.cargo_hold    = [];
	return self;
}


exports.projectile = function(){  //Empty component, mainly used to identify if an entity a projectile
	var self = {};
	self.parent_id = null;
	self.life_span = 400;
	self.spawn     = 0;
	return self;
}
exports.weapon = function(){
	var self = {};
	self.parent_id              = null;
	self.cooldown_between_shots = 20;
	self.cooldown_current       = 20;
	return self;
}

exports.range = function(){
	var self = {}
	return self;
}

exports.collision = function(){
	self = {};
	self.collision_target = null;
	return self;
}