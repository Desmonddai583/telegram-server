var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var md5 = require('MD5');
var fs = require('fs');
var bcrypt = require('bcrypt');
var async = require("async");
var jade = require('jade');
var userUtil = require('../utils/user-utils');
var mailer = require('../utils/mailer');
var User = mongoose.model('User');

router.post('/forgotPassword', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user){
    if (err) return console.error(err);
    if (!user) { return res.status(400).send("The user does not exist!"); }
    var token = userUtil.generateToken(10, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');
    User.findOneAndUpdate({email: req.body.email}, {$set: {token: token}}, function(err, user) {
      fs.readFile('templates/emails/send-reset-password.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var fn = jade.compile(data);
        var resetPasswordLink = "http://localhost.com/reset_password/" + user.token
        var html = fn({resetPasswordLink: resetPasswordLink});

        var data = {
          from: 'desmonddai583@gmail.com',
          to: user.email,
          subject: 'Reset Password',
          html: html
        };
        mailer.sendEmail(data, res);
      });      
    });  
  });
});

router.get('/checkToken', function(req, res){
  User.findOne({token: req.query.token}, function(err, user){
    if (err) return console.error(err);
    if (!user) { return res.status(400).send("The token expired or does not exist!"); }
    res.status(200).send({});
  });
});

router.post('/resetPassword', function(req, res) {
  User.findOne({token: req.body.token}, function(err, user){
    if (err) return console.error(err);
    if (!user) { return res.status(400).send("The token expired or does not exist!"); }

    async.waterfall([
      function(callback) {
        bcrypt.genSalt(10, callback);
      },
      function(salt, callback) {
        bcrypt.hash(req.body.password, salt, callback);
      },
      function(hash, callback) {
        User.findOneAndUpdate({token: req.body.token}, {$set: {password: hash}}, callback);
      },
    ], function(err, user) {
      if (err) return console.error(err);
      if (!user) { return res.status(400).send("The token expired or does not exist!"); }
      User.findOneAndUpdate({token: req.body.token}, {$set: {token: null}}, function() {
        res.status(200).send({});
      });
    }); 
  });
});

router.get('/logout', function(req, res){
  req.logout();
  res.status(200).end();
});

module.exports = router;