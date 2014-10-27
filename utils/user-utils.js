var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
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