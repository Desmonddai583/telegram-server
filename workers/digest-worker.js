var logger = require('nlogger').logger(module);
var mongoose = require('mongoose');
var Consumer = require('sqs-consumer');
var db = require('../database/database');
var User = mongoose.model('User');

db.once('open', function callback () {
  var app = new Consumer({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/410293358835/sendDigest',
    region: 'us-east-1',
    handleMessage: function (message, done) {
      logger.info(message)
      done();
    }
  });

  app.start();
});