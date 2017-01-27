
var image_map_source = {
	"ship_standard":"assets/sprites/ship_standard.png",
	"ship_tank"    :"assets/sprites/ship_tank.png",
	"laser"        :"assets/sprites/laser.png",
	"bullet"       :"assets/sprites/bullet.png",
	"arena01"   :"assets/backgrounds/arena01.png"
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

self.Stats = new Vue({
	el: '#top_left',
	data:{
		max_health  : null,
		value_health: null,
		max_shield  : null,
		value_shield: null
	}
});

$(function(){
    $( "#draggable" ).draggable();
});

var createDialog = function(text){
	dialog = document.createElement('div');
	dialog.id = "dialog";
	dialog.innerHTML = "<p>"+text+"</p>";
	document.body.appendChild(dialog);
}

var findMatch = function(){
	GlobalSocket.emit("find_match");
	GlobalSocket.on("found_game", function(data){
		loading_screen();
	});
	GlobalSocket.on("start_game", function(data){
			game_start();
	});
	document.getElementById("btn_findmatch").style.display = "none";
	document.getElementById("btn_cancelmatch").style.display = "block";
}
var cancelMatch = function(){
	GlobalSocket.emit("cancel_matchmaking");
	GlobalSocket.off("found_game");
	GlobalSocket.off("starting_game");

	document.getElementById("btn_findmatch").style.display = "block";
	document.getElementById("btn_cancelmatch").style.display = "none";
}

var Camera = function(canvas){
	self = {};
	self.canvas = canvas;
	self.camera_x = 0;
	self.camera_y = 0;
	self.draw_border = false;
	self.draw = function(ctx, ent, image){
		if(ent.id == player_id){
			self.camera_x = ent.position.x;
			self.camera_y = ent.position.y;
		}
		screenX = (ent.position.x - self.camera_x + (self.canvas.width / 2 ));
		screenY = (ent.position.y - self.camera_y + (self.canvas.height/ 2 ));

		angleInRadians = ent.position.rotation * Math.PI / 180;
		ctx.save();
		//ctx.translate(entity.position.x, entity.position.y);
		ctx.translate(screenX + image.naturalWidth / 2, screenY + image.naturalHeight / 2);
		ctx.rotate(-angleInRadians);
		ctx.drawImage(image, -(image.naturalWidth/2), -(image.naturalHeight/2));
		ctx.restore();

		if(self.draw_border == true){
			
			ctx.strokeRect(screenX, screenY, (image.naturalWidth), (image.naturalHeight));
		}
	}
	return self;
}


var get_center = function(pos, image){
	center_x = pos.x + image.width / 2;
	center_y = pos.y + image.height / 2;
	return {'x': center_x, 'y':center_y}
}

var player_id = null;

var game_start = function(){
	game_screen();
	canvas = document.getElementById('gameCanvas');
	canvas.width = canvas.scrollWidth;
	canvas.height = canvas.scrollHeight;
	arena_size = 900;

	ctx = canvas.getContext('2d');
	
	 
	camera = Camera(canvas);
	chatbox    = document.getElementById('chatbox');
	chat_input = document.getElementById('user_message');
	chat_input.onkeypress = function(e) {
	    var event = e || window.event;
	    var charCode = event.which || event.keyCode;

	    if ( charCode == '13' ) {
	      GlobalSocket.emit("message_server", chat_input.value);
	      console.log(chat_input.value)
	      chat_input.value = '';
	      return false;
	    }
	}

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

    GlobalSocket.on("start_countdown", function(data){
	    	countdown(ctx, canvas);
	});
	
    GlobalSocket.on("render_packets", function(data){
    	ctx.clearRect(0,0, canvas.width, canvas.height);
    	//ctx.drawImage(image_map["background"], -(camera.camera_x + ( self.canvas.width / 2)), -(camera.camera_y +(self.canvas.height / 2)), 1000, 1000);
    	//ctx.drawImage(image_map['arena01'], (0 - camera.camera_x + (self.canvas.width / 2)) -(arena_size / 2) , (0 - camera.camera_y + (self.canvas.height / 2)-(arena_size/2)), arena_size, arena_size);
    	ctx.beginPath();
		ctx.arc((0 - camera.camera_x + (self.canvas.width / 2)) , (0 - camera.camera_y + (self.canvas.height / 2)), arena_size, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'green';
      	ctx.fill();
		ctx.lineWidth = 5;
		ctx.strokeStyle = '#003300';
		ctx.stroke();
		ctx.closePath();
		
    	for(var i in data){
    		entity    = data[i];
    		player_id = entity.client_id;
    		image     = image_map[entity.image.image];
    		camera.draw(ctx, entity, image);
    		if(entity.id == player_id){
    			Stats.max_health   = entity.stats.health.stats.max_health;
    			Stats.value_health = entity.stats.health.stats.current_health;
    			Stats.max_shield   = entity.stats.shield.stats.max_shield;
    			Stats.value_shield = entity.stats.shield.stats.current_shield;
    		}
    	}
    	
    });

    GlobalSocket.on("message_client", function(data){
    	create_message(data);
    });
    GlobalSocket.on("disconnect_game", function(data){
    	createDialog(data);
    	main_menu(data);
    });
}
var create_message = function(data){
	message = document.createElement('div');
	message.textContent = data;
	message.className = 'server_message'
	chatbox.appendChild(message);
}
var main_menu = function(data){
	document.getElementById("main_menu").style.display = "block";
	document.getElementById('game_div').style.display = 'none';
	document.getElementById("loading").style.display = "none";
	document.getElementById("btn_findmatch").style.display = "block";
	document.getElementById("btn_cancelmatch").style.display = "none";
	console.log("Switched to main menu")
	GlobalSocket.off("disconnect_game");
	GlobalSocket.off("render_packets");
	//Add kills all socket.on request that dont belong to the main_menu.
}

var loading_screen = function(){
	document.getElementById("main_menu").style.display = "none";
	document.getElementById('game_div').style.display = 'none';
	document.getElementById("loading").style.display = "block";
}

var countdown = function(ctx, canvas){
	timer = 6;
	ctx.font = "190px Comic Sans MS";
	ctx.fillStyle = "red";
	ctx.textAlign = "center";
	ctx.fillText("Game starting in...", canvas.width / 2, canvas.height / 2);
	var timeout = setInterval(function(){
		timer--;
		ctx.font = "190px Comic Sans MS";
		ctx.fillStyle = "red";
		ctx.textAlign = "center";
		ctx.fillText(timer, canvas.width / 2, canvas.height / 2);
		console.log(timer);
		if(timer == 0){
			clearInterval(timeout);
		}

	}, 1000);
}

var game_screen = function(){
	document.getElementById("main_menu").style.display = "none";
	document.getElementById('game_div').style.display = 'block';
	document.getElementById("loading").style.display = "none";
}

var initialize = function(){

	GlobalSocket.on("initialization", function(data){
		self.UserData = new Vue({
			el  : '#main_menu',
			data: {
				name     : data.name,
				level    : data.level,
				xp       : data.xp
			}
		});
		done = true;
		main_menu();
	});

}


initialize();
