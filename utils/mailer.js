var nconf = require('../middleware/nconf-config');
var fs = require('fs');
var jade = require('jade');
var mailgun = require('mailgun-js')({apiKey: nconf.get('mailgun:api-key'), domain: nconf.get('mailgun:domain')});

var mailer = exports;

mailer.compileTemplate = function(user, res) {
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

function sendEmail(data, res) {
  mailgun.messages().send(data, function(err, body) {
    if (err) return console.error(err);
    res.status(200).send({});
  });
}