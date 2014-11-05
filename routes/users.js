var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require("async");
var nconf = require('../middleware/nconf-config');
var stripe = require("stripe")(nconf.get('stripe:secret-key'));
var userUtil = require('../utils/user-utils');
var User = mongoose.model('User');

router.get('/', function(req,res,next) {
  switch (req.query.operation) {
    case 'isAuthenticated':
      handleAuthRequest(req,res);
      break;
    case 'login':
      handleLoginRequest(req,res,next);
      break;
    case 'followers':
      handleFollowersRequest(req,res);
      break;
    case 'following':
      handleFollowingRequest(req,res);
      break;
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

  userUtil.hashPassword(object, function(err, hash) {
    var newUser = new User({ id: object.id, password: hash, name: object.name, email: object.email, photo: 'images/avatar1.png' });
    newUser.save(function (err, user) {
      if (err) return console.error(err);
      req.logIn(newUser, function(err) {
        return res.status(200).send({"users": [userUtil.emberUser(newUser)]});
      });
    });
  });
});

router.post('/follow', function(req,res) {
  var follow = req.body.followingID;
  
  handlerFollowUserRequest(req,res,follow);
});

router.post('/unfollow', function(req,res) {
  var unfollow = req.body.unfollowingID;

  handlerUnFollowUserRequest(req,res,unfollow);
});

router.post('/upgrade_account', function(req,res) {
  var upgrade_token = req.body.token;
  var account_email = req.body.email;

  handlerUpgradeAccountRequest(req,res,upgrade_token,account_email);
});

function handleLoginRequest(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return res.status(500).end(); }
    if (!user) { return res.status(400).send(info.message); } 
    req.logIn(user, function(err) {
      return res.status(200).send({"users": [userUtil.emberUser(user)]});
    }); 
  })(req, res, next)
}

function handleAuthRequest(req, res) {
  if(req.isAuthenticated()){
    return res.status(200).send({'users': [req.user]});
  }
  else{
    return res.status(200).send({'users': []});
  }
}

function handleFollowersRequest(req, res) {
  User.find({following: req.query.user}, function(err, followers){
    var users = [];
    followers.forEach(function(user) {
      users.push(userUtil.emberUser(user,req.user));
    }); 
    res.status(200).send({'users': users});
  });
}

function handleFollowingRequest(req, res) {
  User.find({followers: req.query.user}, function(err, following){
    var users = [];
    following.forEach(function(user) {
      users.push(userUtil.emberUser(user,req.user));
    }); 
    res.status(200).send({'users': users});
  });
}

function handlerFollowUserRequest(req,res,follow) {
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
    res.status(200).send({});
  });
}

function handlerUnFollowUserRequest(req,res,unfollow) {
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
    res.status(200).send({});
  });
}

function handlerUpgradeAccountRequest(req,res,upgrade_token,account_email) {
  async.waterfall([
    function(callback) {
      stripe.customers.create({
        description: 'Customer for ' + account_email,
        card: upgrade_token 
      }, function(err, customer) {
        callback(null, customer.id);
      });
    },
    function(customer_id, callback) {
      stripe.customers.createSubscription(
        customer_id,
        {plan: 'Pro'},
        function(err, subscription) {
          callback(null, subscription.customer);
        }
      );
    },
    function(customer_id, callback) {
      User.update({id: req.user.id}, {$set: {stripeCustomerID: customer_id, isPro: true}}, function(err){
        callback(null);
      });
    }
  ], function(err) {
    if (err) return res.status(500).send(err.message);
    res.status(200).send({});
  });
}

module.exports = router;