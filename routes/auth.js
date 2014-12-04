var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var md5 = require('MD5');
var bcrypt = require('bcrypt');
var async = require("async");
var logger = require('nlogger').logger(module);
var mailer = require('../utils/mailer');
var User = mongoose.model('User');

router.post('/forgotPassword', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user){
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    if (!user) { return res.status(400).send("The user does not exist!"); }
    var token = User.generateToken(10);
    User.findOneAndUpdate({email: req.body.email}, {$set: {token: token}}, function(err, user) {
      if (err) { 
        logger.error(err);
        return res.status(500).send(err.message);  
      }
      mailer.sendResetPassword(user, function(err) {
        if (err) { 
          logger.error(err);
          return res.status(500).send(err.message);  
        }
        res.status(200).send({});
      });
    });  
  });
});

router.get('/checkToken', function(req, res){
  User.findOne({token: req.query.token}, function(err, user){
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    if (!user) { return res.status(400).send("The token expired or does not exist!"); }
    res.status(200).send({});
  });
});

router.post('/resetPassword', function(req, res) {
  User.findOne({token: req.body.token}, function(err, user){
    if (err) { 
      logger.error(err);
      return res.status(500).send(err.message);  
    }
    if (!user) { return res.status(400).send("The token expired or does not exist!"); }

    async.waterfall([
      function(callback) {
        User.hashPassword(req.body, callback);
      },
      function(hash, callback) {
        User.findOneAndUpdate({token: req.body.token}, {$set: {password: hash, token: null}}, callback);
      },
    ], function(err, user) {
      if (err) { 
        logger.error(err);
        return res.status(500).send(err.message);  
      }
      if (!user) { return res.status(400).send("The token expired or does not exist!"); }
      res.status(200).send({});
    }); 
  });
});

router.get('/logout', function(req, res){
  req.logout();
  res.status(200).end();
});

module.exports = router;