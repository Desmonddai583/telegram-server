var async = require("async");
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('User');

function initPassport() {
  var passport = require('passport');
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findByUserId(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy({
      usernameField: 'id',
      passwordField: 'password'
    },
    function(username, password, done) {
      async.waterfall([
        function(callback) {
          User.findByUserId(username, callback); 
        },
        function(user,callback) {
          validateUser(user, password, callback);
        }
      ], function(err, user, info) {
        if (err) {
          return done(err);
        }
        return done(err, user, info);  
      });
    }
  ));  
  return passport;
}

function validateUser(user, password, callback) {
  if (user) { 
    user.comparePassword(password, function(err, res) {
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

module.exports = initPassport();