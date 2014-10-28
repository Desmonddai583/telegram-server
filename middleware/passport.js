var passport = require('passport');
var async = require("async");
var LocalStrategy = require('passport-local').Strategy;
var userUtil = require('../utils/user-utils');

module.exports = function() {
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
          userUtil.validateUser(user, password, callback);
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
