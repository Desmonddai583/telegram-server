var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var passport = require('passport')
var User = mongoose.model('User');

var userUtil = exports;

userUtil.findById = function(id, callback) {
  User.findOne({'id': id}, callback);
}

userUtil.validateUser = function(user, password, callback) {
  if (user) { 
    bcrypt.compare(password, user.password, function(err, res) {
      if (res) {
        callback(null, user);
      } else {
        callback(null, false, { message: 'Invalid credential, please check your username and password.' });
      }
    });
  } else {
    callback(null, false, { message: 'Invalid credential, please check your username and password.' });
  }  
}

userUtil.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(403).end();  
}

userUtil.emberUser = function(user, current_user) {
  var newUser = {id: user.id, name: user.name, photo: user.photo};
  if (current_user) {
    if (user.followers && user.followers.indexOf(current_user.id) >= 0) {
      newUser.isFollowedByCurrentUser = true;
    }
  }
  return newUser;
}

userUtil.generateToken = function(n, a) {
  var index = (Math.random() * (a.length - 1)).toFixed(0);
  return n > 0 ? a[index] + userUtil.generateToken(n - 1, a) : '';
};

userUtil.handleLoginRequest = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return res.status(500).end(); }
    if (!user) { return res.status(400).send(info.message); } 
    req.logIn(user, function(err) {
      return res.status(200).send({"users": [userUtil.emberUser(user)]});
    }); 
  })(req, res, next)
};

userUtil.handleAuthRequest = function(req, res) {
  if(req.isAuthenticated()){
    return res.status(200).send({'users': [req.user]});
  }
  else{
    return res.status(200).send({'users': []});
  }
};

userUtil.handleFollowersRequest = function(req, res) {
  User.find({following: req.query.user}, function(err, followers){
    var users = [];
    followers.forEach(function(user) {
      users.push(userUtil.emberUser(user,req.user));
    }); 
    res.status(200).send({'users': users});
  });
};

userUtil.handleFollowingRequest = function(req, res) {
  User.find({followers: req.query.user}, function(err, following){
    var users = [];
    following.forEach(function(user) {
      users.push(userUtil.emberUser(user,req.user));
    }); 
    res.status(200).send({'users': users});
  });
};