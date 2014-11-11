var logger = require('nlogger').logger(module);
var Consumer = require('sqs-consumer');
var async = require("async");
var mongoose = require('mongoose');
var nconf = require('../middleware/nconf-config');
var db = require('../database/database');
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({accessKeyId: nconf.get('sqs:aws-id'), secretAccessKey: nconf.get('sqs:aws-secret'), region: nconf.get('sqs:region')});
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var mailer = require('../utils/mailer');

db.once('open', function callback () {
  var app = new Consumer({
    queueUrl: nconf.get('sqs:queue-url'),
    region: nconf.get('sqs:region'),
    sqs: sqs,
    handleMessage: function (message, done) {
      user_id = JSON.parse(message.Body).userID;

      async.parallel([
        function(callback) {
          Post.find({author: user_id}).sort({'date':-1}).limit(5).exec(function(err, posts){ 
            if(err) {
              logger.error(err)
              return callback(err);
            }
            callback(null, posts)
          });
        },
        function(callback) {
          User.findOne({id: user_id}, function(err, user) { 
            if(err) {
              logger.error(err)
              return callback(err);
            }
            callback(null, user)
          });
        }
      ], function(err, results) {
        if (err) return done(err);
        mailer.sendDigest(results[0],results[1], function() {
          done();
        })
      });
    }
  });
  app.start();
});