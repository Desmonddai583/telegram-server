var async = require("async");
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var userUtil = require('../utils/user-utils');

function initPassport() {
  var passport = require('passport');
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    userUtil.findById(id, function(err, user) {
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
          userUtil.findById(username, callback); 
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

module.exports = initPassport();