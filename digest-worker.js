var logger = require('nlogger').logger(module);
var mongoose = require('mongoose');
var nconf = require('./middleware/nconf-config');
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({accessKeyId: nconf.get('sqs:aws-id'), secretAccessKey: nconf.get('sqs:aws-secret'), region: nconf.get('sqs:region')});
var Consumer = require('sqs-consumer');
var db = require('./database/database');
var User = mongoose.model('User');

db.once('open', function callback () {
  var app = new Consumer({
    queueUrl: nconf.get('sqs:queue-url'),
    region: nconf.get('sqs:region'),
    sqs: sqs,
    handleMessage: function (message, done) {
      logger.info(message)
      done();
    }
  });
  app.start();
});