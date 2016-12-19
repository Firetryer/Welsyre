
var image_map_source = {
	"ship_standard":"assets/sprites/ship_standard.png",
	"ship_tank"    :"assets/sprites/ship_tank.png",
	"laser"        :"assets/sprites/laser.png"
}
var image_map = {

}
var LoadAllImages = function(){
	for(key in image_map_source){
		image_map[key]     = new Image();
		image_map[key].src = image_map_source[key];
	}
}
var GlobalSocket = io();
LoadAllImages();
var findMatch = function(){
	GlobalSocket.emit("find_match");
	GlobalSocket.on("found_game", function(data){
		game_start(data);
	});
	document.getElementById("btn_findmatch").style.display = "none";
	document.getElementById("btn_cancelmatch").style.display = "block";
}
var cancelMatch = function(){
	GlobalSocket.emit("cancel_matchmaking");
	GlobalSocket.off("found_game");

	document.getElementById("btn_findmatch").style.display = "block";
	document.getElementById("btn_cancelmatch").style.display = "none";
}

var Camera = function(canvas){
	self = {};
	self.canvas = canvas;
	self.camera_x = 0;
	self.camera_y = 0;

	self.draw = function(ctx, ent, image){
		if(ent.id == player_id){
			self.camera_x = ent.position.x;
			self.camera_y = ent.position.y;
		}
		screenX = ent.position.x - self.camera_x + (self.canvas.width / 2);
		screenY = ent.position.y - self.camera_y + (self.canvas.height/ 2);

		angleInRadians = ent.position.rotation * Math.PI / 180;
		ctx.save();
		//ctx.translate(entity.position.x,entity.position.y);
		ctx.translate(screenX,screenY);
		ctx.rotate(-angleInRadians);
		ctx.drawImage(image, -(image.naturalWidth/2), -(image.naturalHeight/2));
		ctx.restore();
	}
	return self;
}

var game_start = function(data, ctx){
	canvas = document.getElementById('gameCanvas');
	canvas.width = canvas.scrollWidth;
	canvas.height = canvas.scrollHeight;
	ctx = canvas.getContext('2d');
	
	GlobalSocket.on("game_info", function(data){
		player_id = data;
	});
	camera = Camera(canvas);

	document.getElementById("main_menu").style.display = 'none';
	document.getElementById("game_div").style.display = 'absolute';

	document.body.onkeydown = function(event){
	    if(event.keyCode === 68)    //d
	    	GlobalSocket.emit('keyPress',{KEY:'D',isPressed:true, id:player_id});
	    else if(event.keyCode === 83)   //s
	    	GlobalSocket.emit('keyPress',{KEY:'S',isPressed:true, id:player_id});
	    else if(event.keyCode === 65) //a
	    	GlobalSocket.emit('keyPress',{KEY:'A',isPressed:true, id:player_id});
	    else if(event.keyCode === 87) // w
	    	GlobalSocket.emit('keyPress',{KEY:'W',isPressed:true, id:player_id});
	    else if(event.keyCode === 32) // Space
	    	GlobalSocket.emit('keyPress',{KEY:'SPACE',isPressed:true, id:player_id});

	}
	document.body.onkeyup = function(event){
        if(event.keyCode === 68)    //d
        	GlobalSocket.emit('keyPress',{KEY:'D',isPressed:false, id:player_id});
        else if(event.keyCode === 83)   //s
        	GlobalSocket.emit('keyPress',{KEY:'S',isPressed:false, id:player_id});
        else if(event.keyCode === 65) //a
        	GlobalSocket.emit('keyPress',{KEY:'A',isPressed:false, id:player_id});
        else if(event.keyCode === 87) // w
        	GlobalSocket.emit('keyPress',{KEY:'W',isPressed:false, id:player_id});
        else if(event.keyCode === 32) // Space
	    	GlobalSocket.emit('keyPress',{KEY:'SPACE',isPressed:false, id:player_id});
    }

    GlobalSocket.on("render_packets", function(data){

    	ctx.clearRect(0,0, canvas.width, canvas.height);
    	for(var i in data){
    		entity = data[i];
    		image  = image_map[entity.image.image];
    		camera.draw(ctx, entity, image);
    	}

    });
    GlobalSocket.on("disconnect_game", function(data){
    	main_menu(data);
    });
}

var main_menu = function(data){
	document.getElementById("main_menu").style.display = "block";
	document.getElementById('game_div').style.display = 'none';
	document.getElementById("btn_findmatch").style.display = "block";
	document.getElementById("btn_cancelmatch").style.display = "none";
	console.log("Switched to main menu")
	GlobalSocket.off("disconnect_game");
	GlobalSocket.off("render_packets");
	//Add kills all socket.on request that dont belong to the main_menu.
}



GlobalSocket.on("information", function(data){
	console.log(data.request);
	if(data.request == 'accepted'){
		self.UserData = new Vue({
			el  : '#information',
			data: {
				user_name: data.user_name
			}
		});
	}
});



