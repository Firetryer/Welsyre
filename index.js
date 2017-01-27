var express             = require('express');
var path                = require('path');
var cookieParser        = require('cookie-parser');
var cookie              = require("cookie");
var bodyParser          = require('body-parser');
var expressValidator    = require('express-validator');
var flash               = require('connect-flash');
var session             = require('express-session');
var passport            = require('passport');
var LocalStrategy       = require('passport-local').Strategy;
var passportIo          = require("passport.socketio");
var mongo               = require('mongodb');
var mongoose            = require('mongoose');
var MongoStore          = require('connect-mongo')(session);

//var routes              = require('./routes/index');
var users               = require('./routes/users');

mongoose.connect('mongodb://127.0.0.1/loginapp');
var db = mongoose.connection;

//Initialize App
var app = express();
var serv = require('http').Server(app)
var io = require("socket.io").listen(serv);

//View Engine
app.set('views', path.join(__dirname, 'views'));
//app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'ejs')
//app.set('view engine', 'handlebars');

//BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

//Set static folder
app.use(express.static(path.join(__dirname, 'client')));

//Mongodb Session
sessionStore = new MongoStore({ mongooseConnection: mongoose.connection})

app.use(session({
	key: 'express.sid',
	store: sessionStore,
	secret:'keyboard_cat',
	ttl: 12 * 60 * 60,
	saveUninitialized: true,
	resave: true

}));

io.use(passportIo.authorize({
	cookieParser: cookieParser,       
	key:          'express.sid',     
	secret:       'keyboard_cat',    
	store:        sessionStore,        
	success:      onAuthorizeSuccess,  
	fail:         onAuthorizeFail
}));

function onAuthorizeSuccess(data, accept){
	console.log('successful connection to socket.io');
	accept();
}

function onAuthorizeFail(data, message, error, accept){
	console.log('failed connection to socket.io:', message);
	if(error)
		accept(new Error(message));
}

//Passport Init
app.use(passport.initialize());
app.use(passport.session());

//Express Validator
app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
		var namespace = param.split('.')
		, root    = namespace.shift()
		, formParam = root;

		while(namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param : formParam,
			msg   : msg,
			value : value
		};
	}
}));

//Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next){
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

app.use('/', users);
console.log("server started on port 8080.");
serv.listen(8080);

//Game logic here.
var network = require('./welsyre/match_making.js');


io.sockets.on('connect', function (socket) {
	
	network.newConnections(socket);


});

lastUpdate = Date.now();

setInterval(function(){
	now = Date.now();
	dt = now - lastUpdate;
	lastUpdate = now;

	network.MatchMaking();
	network.Update_Game(dt / 1000.0)



}, 1000/60);




