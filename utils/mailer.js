var nconf = require('../middleware/nconf-config');
var fs = require('fs');
var jade = require('jade');
var logger = require('nlogger').logger(module);
var mailgun = require('mailgun-js')({apiKey: nconf.get('mailgun:api-key'), domain: nconf.get('mailgun:domain')});

var mailer = exports;

mailer.resetPassword = function(user, res) {
  fs.readFile('templates/emails/send-reset-password.jade', 'utf8', function (err, data) {
    if (err) throw err;
    var fn = jade.compile(data);
    var resetPasswordLink = "http://" + nconf.get('client:host') + "/reset_password/" + user.token
    var html = fn({resetPasswordLink: resetPasswordLink});

    var data = {
      from: 'desmonddai583@gmail.com',
      to: user.email,
      subject: 'Reset Password',
      html: html
    };

    sendEmail(data, res);
  });
}

mailer.expireProAccount = function(user,res) {
  if (user) {
    fs.readFile('templates/emails/expire-pro-account.jade', 'utf8', function (err, data) {
      if (err) throw err;
      var fn = jade.compile(data);
      var html = fn();

      var data = {
        from: 'desmonddai583@gmail.com',
        to: user.email,
        subject: 'Pro Account Expired',
        html: html
      };

      sendEmail(data, res);
    });     
  } else {
    res.status(200).send({});
  }
}

function sendEmail(data, res) {
  mailgun.messages().send(data, function(err, body) {
    if (err) return logger.error(err);
    res.status(200).send({});
  });
}