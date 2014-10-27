var api_key = 'key-e2a50d6091c24a46f1a5d047ceebbae5';
var domain = 'sandbox6cee921710e44a21ae485a9555b7229a.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var mailer = exports;

mailer.sendEmail = function(data, res) {
  mailgun.messages().send(data, function(err, body) {
    if (err) return console.error(err);
    res.status(200).send({});
  });
}
