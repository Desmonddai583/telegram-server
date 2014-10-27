var mongoose = require('mongoose');
var md5 = require('MD5');
var fs = require('fs');
var bcrypt = require('bcrypt');
var async = require("async");
var jade = require('jade');
var userUtil = require('../utils/user-utils');
var mailer = require('../utils/mailer');
var User = mongoose.model('User');

module.exports = function (app) {
  app.post('/api/resetPassword/', function(req, res) {
    User.findOne({email: req.body.email}, function(err, user){
      if (err) return console.error(err);
      if (!user) { return res.status(400).send("The user does not exist!"); }
      var password = userUtil.makePasswd(13, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');
      var MD5Password = md5(password);

      async.waterfall([
        function(callback) {
          bcrypt.genSalt(10, callback);
        },
        function(salt, callback) {
          bcrypt.hash(MD5Password, salt, callback);
        },
        function(hash, callback) {
          User.findOneAndUpdate({email: req.body.email}, {$set: {password: hash}}, callback);
        },
      ], function(err, user) {
        fs.readFile('templates/emails/send-reset-password.jade', 'utf8', function (err, data) {
          if (err) throw err;
          var fn = jade.compile(data);
          var html = fn({password: password});

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

  app.get('/api/logout', function(req, res){
    req.logout();
    res.status(200).end();
  });
}