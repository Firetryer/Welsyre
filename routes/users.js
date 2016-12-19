var express = require('express');
var User = require('../models/user')
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//Register
router.get('/register', function(req, res){
	data = {
		title: "Land of Welsyre",
		css: ['style.css', 'bootstrap.css'],
	}
	res.render('register', data);
});

//Login
router.get('/', function(req, res){
	data = {
		authenticated: false
	}
	if(req.isAuthenticated()){
		data.authenticated =  true;
		data.username = req.user.username;
	}
	res.render('login', data);
});

//Game
router.get('/game', ensureAuthenticated, function(req, res){
	res.render('game');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		req.flash('error_msg', 'Log in first to play!');
		res.redirect('/');
	}
}


//Register
router.post('/register', function(req, res){
	var email = req.body.email;
	var username = req.body.username.toLowerCase();
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	User.findOne({username: username}, function(err, user) {
		if(err){
			return done(err);
		}
		if(user || errors){
			console.log(errors);
			if(user && errors != false){
				errors.push({ param: 'username', msg: 'Username Already Taken', value: '' });
			}else{
				errors = [{ param: 'username', msg: 'Username Already Taken', value: '' }];
			}
			res.render('register',{
				errors: errors
			});
		}else{
			var newUser = new User({
				username: username,
				email: email,
				password: password
			});
			User.createUser(newUser, function(err, user){
				if(err) throw err;
			});

			req.flash("success_msg", "You are registered and can now log in!");

			res.redirect('/');
		}
	});
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username.toLowerCase(), function(err, user){
			if(err){
				throw err;	
			} 
			if(!user){
				return done(null, false, {message: 'Unknown User'});
			}
			User.comparePassword(password, user.password, function(err, isMatch){
				if(err){
					throw err;
				}
				if(isMatch){
					return done(null, user);
				}else{
					return done(null, false, user, {message: "Invalid Password"});
				}
			})
		});
}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});

router.post('/',
	passport.authenticate('local', {successRedirect: '/', failureRedirect:'/', failureFlash: true}),
	function(req, res){
		res.redirect('/');
});

router.get('/logout', function(req, res){
	req.logout();
	req.flash('success_msg', 'You are logged out.');
	res.redirect('/');
});

module.exports = router;