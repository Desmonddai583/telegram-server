var nconf = require('../config/nconf-config');
var fs = require('fs');
var jade = require('jade');
var logger = require('nlogger').logger(module);
var mailgun = require('mailgun-js')({apiKey: nconf.get('mailgun:api-key'), domain: nconf.get('mailgun:domain')});

var mailer = exports;

mailer.resetPassword = function(user, callback) {
  fs.readFile('templates/emails/send-reset-password.jade', 'utf8', function (err, data) {
    if (err) {
      logger.error(err);
      callback(err);
    }
    var fn = jade.compile(data);
    var resetPasswordLink = "http://" + nconf.get('client:host') + "/reset_password/" + user.token
    var html = fn({resetPasswordLink: resetPasswordLink});

    var data = {
      from: 'desmonddai583@gmail.com',
      to: user.email,
      subject: 'Reset Password',
      html: html
    };

    sendEmail(data, callback);
  });
}

mailer.expireProAccount = function(user, callback) {
  if (user) {
    fs.readFile('templates/emails/expire-pro-account.jade', 'utf8', function (err, data) {
      if (err) {
        logger.error(err);
        callback(err);
      }
      var fn = jade.compile(data);
      var html = fn();

      var data = {
        from: 'desmonddai583@gmail.com',
        to: user.email,
        subject: 'Pro Account Expired',
        html: html
      };

      sendEmail(data, callback);
    });     
  } else {
    callback(null);
  }
}

mailer.sendDigest = function(posts, user, callback) {
  fs.readFile('../templates/emails/send-digest.jade', 'utf8', function (err, data) {
    if (err) {
      logger.error(err);
      callback(err);
    }
    var fn = jade.compile(data);
    var html = fn({posts: posts});
    var data = {
      from: 'desmonddai583@gmail.com',
      to: user.email,
      subject: 'Digest From Telegram',
      html: html
    };

    sendEmail(data, callback);
  });
}

function sendEmail(data, callback) {
  mailgun.messages().send(data, function(err, body) {
    if (err) {
      logger.error(err);
      callback(err);
    }
    callback(null);
  });
}