var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require("async");
var aws = require('aws-sdk');
var crypto = require('crypto');
var nconf = require('../config/nconf-config');
var logger = require('nlogger').logger(module);
var stripe = require("stripe")(nconf.get('stripe:secret-key'));
var mailer = require('../utils/mailer');
var ensureAuthenticated = require('../middleware/ensureAuthenticated');
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

router.get('/sign_s3', ensureAuthenticated, function(req, res){
  var expiration = new Date();
  expiration.setHours(expiration.getHours() + 1);

  var policy = {
      expiration: expiration.toISOString(),
      conditions: [
          {bucket: nconf.get('aws:bucket-name')},
          {acl: "public-read"},
          ["starts-with", "$key", ""] ,
          ["content-length-range", 0, 1048576]
      ]
  };
  var awsKeyId = nconf.get('aws:aws-id');
  var awsKey = nconf.get('aws:aws-secret');

  var policyString = JSON.stringify(policy);
  var encodedPolicyString = new Buffer(policyString).toString("base64");

  var hmac = crypto.createHmac("sha1", awsKey);
  hmac.update(encodedPolicyString);

  var digest = hmac.digest('base64');

  res.json({key: req.query.name, 
            acl: 'public-read', 
            bucket: nconf.get('aws:bucket-name'), 
            awsaccesskeyid: awsKeyId, 
            policy: encodedPolicyString, 
            signature: digest});
  res.end();
});

router.get('/:user_id', function(req,res) {
  User.findById(req.params.user_id, function(err, user) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    if (!user) { return res.status(400).send("Can not found the user"); }
    res.status(200).send({"user": user.emberUser(req.user)});
  });
});

router.put('/:user_id', ensureAuthenticated, function(req,res) {
  var info = req.body;
  User.findOneAndUpdate({id: req.user.id}, {$set: {photo: info.photo, name: info.fullName, email: info.email}}, function(err, user) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    res.status(200).send({"user": user.emberUser(user)});
  });
});

router.post('/', function(req,res) {
  var object = req.body.user;

  User.hashPassword(object, function(err, hash) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    var newUser = new User({ id: object.id, password: hash, name: object.name, email: object.email, photo: 'images/avatar1.png' });
    newUser.save(function (err, user) {
      if (err) { 
        logger.error(err);
        return res.status(500).send(err.message);  
      }
      req.logIn(newUser, function(err) {
        if (err) { 
          logger.error(err);
          return res.status(500).send(err.message);  
        }
        return res.status(200).send({"users": [user.emberUser(newUser)]});
      });
    });
  });
});

router.post('/follow', ensureAuthenticated, function(req,res) {
  var follow = req.body.followingID;
  
  handleFollowUserRequest(req,res,follow);
});

router.post('/unfollow', ensureAuthenticated, function(req,res) {
  var unfollow = req.body.unfollowingID;

  handleUnFollowUserRequest(req,res,unfollow);
});

router.post('/upgrade_account', ensureAuthenticated, function(req,res) {
  var upgrade_token = req.body.token;
  var account_email = req.body.email;

  handleUpgradeAccountRequest(req,res,upgrade_token,account_email);
});

router.post('/downgrade_account', ensureAuthenticated, function(req,res) {
  handleDowngradeAccountRequest(req,res);
});

router.post('/update_credit_card', ensureAuthenticated, function(req,res) {
  var updated_token = req.body.token;

  handleUpdateCreditCardRequest(req,res,updated_token);
});

router.post('/expire_pro_account', function(req,res) {
  if (req.body.type === 'charge.failed') {
    handleExpireProAccountRequest(req,res);
  } else {
    res.status(200).end();
  }
});

function handleLoginRequest(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    if (!user) { return res.status(400).send(info.message); } 
    req.logIn(user, function(err) {
      if (err) { 
        logger.error(err);
        return res.status(500).send(err.message);  
      }
      return res.status(200).send({"users": [user.emberUser(user)]});
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
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    var users = [];
    followers.forEach(function(user) {
      users.push(user.emberUser(req.user));
    }); 
    res.status(200).send({'users': users});
  });
}

function handleFollowingRequest(req, res) {
  User.find({followers: req.query.user}, function(err, following){
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    var users = [];
    following.forEach(function(user) {
      users.push(user.emberUser(req.user));
    }); 
    res.status(200).send({'users': users});
  });
}

function handleFollowUserRequest(req,res,follow) {
  async.parallel([
    function(callback) {
     User.update({id: req.user.id}, {$push: {following: follow}}, function(err){
      if(err) {
        logger.error(err);
        return callback(err);
      }
      callback(null);
     });     
    },
    function(callback) {
     User.update({id: follow}, {$push: {followers: req.user.id}}, function(err){
      if(err) {
        logger.error(err);
        return callback(err);
      }
      callback(null);
     });   
    }
  ], function(err) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    res.status(200).send({});
  });
}

function handleUnFollowUserRequest(req,res,unfollow) {
  async.parallel([
    function(callback) {
      User.update({id: req.user.id}, {$pull: {following: unfollow}}, function(err){
        if(err) {
          logger.error(err);
          return callback(err);
        }
        callback(null);
      });  
    },
    function(callback) {
      User.update({id: unfollow}, {$pull: {followers: req.user.id}}, function(err){
        if(err) {
          logger.error(err);
          return callback(err);
        }
        callback(null);
      }); 
    }
  ], function(err) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    res.status(200).send({});
  });
}

function handleUpgradeAccountRequest(req,res,upgrade_token,account_email) {
  async.waterfall([
    function(callback) {
      stripe.customers.create({
        description: 'Customer for ' + account_email,
        card: upgrade_token 
      }, function(err, customer) {
        if(err) {
          logger.error(err);
          return callback(err);
        }
        callback(null, customer.id);
      });
    },
    function(customer_id, callback) {
      stripe.customers.createSubscription(
        customer_id,
        {plan: 'Pro'},
        function(err, subscription) {
          if(err) {
            logger.error(err);
            return callback(err);
          }
          callback(null, subscription.customer);
        }
      );
    },
    function(customer_id, callback) {
      User.update({id: req.user.id}, {$set: {stripeCustomerID: customer_id, isPro: true}}, function(err){
        if(err) {
          logger.error(err);
          return callback(err);
        }
        callback(null);
      });
    }
  ], function(err) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    res.status(200).send({});
  });
}

function handleDowngradeAccountRequest(req,res) {
  async.parallel([
    function(callback) {
      stripe.customers.del(
        req.user.stripeCustomerID,
        function(err) {
          if(err) {
            logger.error(err);
            return callback(err);
          }
          callback(null);
        }
      );
    },
    function(callback) {
      User.update({id: req.user.id}, {$set: {stripeCustomerID: null, isPro: false}}, function(err){
        if(err) {
          logger.error(err);
          return callback(err);
        }
        callback(null);
      }); 
    }
  ], function(err) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    res.status(200).send({});
  });
}

function handleUpdateCreditCardRequest(req,res,updated_token) {
  stripe.customers.update(req.user.stripeCustomerID, {
    card: updated_token
  }, function(err, customer) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    res.status(200).send({});
  });
}

function handleExpireProAccountRequest(req,res) {
  async.parallel([
    function(callback) {
      stripe.customers.del(
        req.body.data.object.customer,
        function(err) {
          if(err) {
            logger.error(err);
            return callback(err);
          }
          callback(null);
        }
      );
    },
    function(callback) {
      User.findOneAndUpdate({stripeCustomerID: req.body.data.object.customer}, {$set: {stripeCustomerID: null, isPro: false}}, function(err, user){
        if(err) {
          logger.error(err);
          return callback(err);
        }
        callback(null, user);
      }); 
    }
  ], function(err, result) {
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    mailer.sendExpireProAccount(result[1], function(err) {
      if (err) { 
        logger.error(err);
        return res.status(500).send(err.message);  
      }
      res.status(200).send({});
    });
  });
}

module.exports = router;