var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require("async");
var userUtil = require('../utils/user-utils');
var User = mongoose.model('User');

router.get('/', function(req,res,next) {
    if (req.query.isAuthenticated) {
      userUtil.handleAuthRequest(req,res);
    }
    else if (req.query.operation === 'login') {
      userUtil.handleLoginRequest(req,res,next);
    }
    else if (req.query.operation === 'followers') {
      userUtil.handleFollowersRequest(req,res);
    }
    else if (req.query.operation === 'following') {
      userUtil.handleFollowingRequest(req,res);
    }
});

router.get('/:user_id', function(req,res) {
  userUtil.findById(req.params.user_id, function(err, user) {
    if (err) { return res.status(500).end(); }
    if (!user) { return res.status(400).send("Can not found the user"); }
    res.status(200).send({"user": userUtil.emberUser(user,req.user)});
  });
});

router.post('/', function(req,res) {
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

router.post('/follow', function(req,res) {
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

router.post('/unfollow', function(req,res) {
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

module.exports = router;