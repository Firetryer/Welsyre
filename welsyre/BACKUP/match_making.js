var disconnect_events = []

var Player = function(id){
	var self = this;

	self.id       = id;
	self.username = null;
	self.session  = null;
	self.inGame = false;
	self.state = 'menu';

	self.getSession = function(){
		return self.session.id;
	}
	self.isInGame = function(boolean){
		self.inGame = boolean;
	}
	return self;
}


var GameSession = function(){
	var self = this;
	self.id = null;
	self.PlayerList = [];

	self.initialize_game_objects = function(){

	}
	self.getPlayerList = function(){
		return self.PlayerList;
	}
	self.ConnectPlayer = function(player){
		self.PlayerList.push(player);
	}

	self.update = function(){
		
	}
	return self;
}

var Network = function(){

	var self = this;

	self.SOCKET_LIST = {};
	self.PLAYER_LIST = {};
	self.JOINING_GAMES = [];
	self.SESSION_LIST = [];

	self.newConnections = function(newsocket){
		console.log("Connection Accepted.");
		newsocket.id = Math.random();

		newsocket.emit("information",{
			request: 'accepted',
			user_name: newsocket.request.user.username
	    });

		self.SOCKET_LIST[newsocket.id] = newsocket;
		PLAYER = new Player(newsocket.id);

		PLAYER.username = newsocket.request.user.username;
		self.PLAYER_LIST[newsocket.id] = PLAYER;

		newsocket.on("find_match", function(){
			console.log("Adding "+newsocket.request.user.username+" to match making queue.")
			self.JOINING_GAMES.push(self.PLAYER_LIST[newsocket.id]);
		});

		newsocket.on('disconnect', function(){
			console.log(newsocket.id + " Disconnected");
			player_temp = self.PLAYER_LIST[newsocket.id]
			if(player_temp.getSession !=null){
				player_temp.getSession.getPlayerList().splice(player_temp.getSession.getPlayerList().indexOf(player_temp));
			}
			delete self.SOCKET_LIST[newsocket.id];
			delete self.PLAYER_LIST[newsocket.id];
		});
	}

	self.Update = function(){
		if(self.JOINING_GAMES.length > 1){

			p1 = self.JOINING_GAMES[Math.floor(Math.random() * self.JOINING_GAMES.length)];
			p2 = self.JOINING_GAMES[Math.floor(Math.random() * self.JOINING_GAMES.length)];
			console.log("Matched "+p1.username+" and "+p2.username+" together.");
			//console.log("Mix and Matching!");

			if(p1.username != p2.username){
				console.log("Matched "+p1.username+" and "+p2.username+" together.");
				console.log("Game Found!");
				self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(p1), 1);
				self.JOINING_GAMES.splice(self.JOINING_GAMES.indexOf(p2), 1);

				p1.isInGame(true);
				p2.isInGame(true);

				var newGameSession = GameSession();
				newGameSession.id = Math.Random();
				newGameSession.ConnectPlayer(p1);
				newGameSession.ConnectPlayer(p2);

				self.SOCKET_LIST[p1.id].emit("found_game", {
					opponentName: p2.username
				});
				self.SOCKET_LIST[p2.id].emit("found_game", {
					opponentName: p1.username
				});
				newGameSession.SessionListener();
				p1.session = newGameSession;
				p2.session = newGameSession;
				self.SESSION_LIST.push(newGameSession);
			}
		}
		for(var i in SESSION_LIST){
			i.update();
		}
	}
}

module.exports = new Network();