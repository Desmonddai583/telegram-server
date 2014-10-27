var passport = require('passport');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require("async");
var userUtil = require('../utils/user-utils');
var User = mongoose.model('User');

module.exports = function (app) {
  app.get('/api/users', function(req,res,next) {
      if (req.query.isAuthenticated) {
        if(req.isAuthenticated()){
          return res.status(200).send({'users': [req.user]});
        }
        else{
          return res.status(200).send({'users': []});
        }
      }
      else if (req.query.operation === 'login') {
        passport.authenticate('local', function(err, user, info) {
          if (err) { return res.status(500).end(); }
          if (!user) { return res.status(400).send(info.message); } 
          req.logIn(user, function(err) {
            return res.status(200).send({"users": [userUtil.emberUser(user)]});
          }); 
        })(req, res, next)
      }
      else if (req.query.operation === 'followers') {
        User.find({following: req.query.user}, function(err, followers){
          var users = [];
          followers.forEach(function(user) {
            users.push(userUtil.emberUser(user,req.user));
          }); 
          res.status(200).send({'users': users});
        });
      }
      else if (req.query.operation === 'following') {
        User.find({followers: req.query.user}, function(err, following){
          var users = [];
          following.forEach(function(user) {
            users.push(userUtil.emberUser(user,req.user));
          }); 
          res.status(200).send({'users': users});
        });
      }
  });

  app.get('/api/users/:user_id', function(req,res) {
    userUtil.findById(req.params.user_id, function(err, user) {
      if (err) { return res.status(500).end(); }
      if (!user) { return res.status(400).send("Can not found the user"); }
      res.status(200).send({"user": userUtil.emberUser(user,req.user)});
    });
  });

  app.post('/api/users/', function(req,res) {
    var object = req.body.user;

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(object.password, salt, function(err, hash) {
        var newUser = new User({ id: object.id, password: hash, name: object.name, email: object.email, photo: 'images/avatar1.png' });
        newUser.save(function (err, user) {
          if (err) return console.error(err);
          req.logIn(newUser, function(err) {
            return res.status(200).send({"users": [userUtil.emberUser(newUser)]});
          });
        });
      });
    });
  });

  app.post('/api/follow/', function(req,res) {
    var follow = req.body.followingID;

    async.parallel([
      function(callback) {
       User.update({id: req.user.id}, {$push: {following: follow}}, function(err){
        if(err) { return console.log(err); }
        callback(err);
       });     
      },
      function(callback) {
       User.update({id: follow}, {$push: {followers: req.user.id}}, function(err){
        if(err) { return console.log(err); }
        callback(err);
       });   
      }
    ], function(err) {
      if (err) return res.status(500).end();
      res.status(200).end();
    });
  });

  app.post('/api/unfollow/', function(req,res) {
    var unfollow = req.body.unfollowingID;

    async.parallel([
      function(callback) {
        User.update({id: req.user.id}, {$pull: {following: unfollow}}, function(err){
          if(err) { return console.log(err); }
          callback(err);
        });  
      },
      function(callback) {
        User.update({id: unfollow}, {$pull: {followers: req.user.id}}, function(err){
          if(err) { return console.log(err); }
          callback(err);
        }); 
      }
    ], function(err) {
      if (err) return res.status(500).end();
      res.status(200).end();
    });
  });
}