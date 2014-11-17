var logger = require('nlogger').logger(module);
var Consumer = require('sqs-consumer');
var async = require("async");
var mongoose = require('mongoose');
var nconf = require('../config/nconf-config');
var db = require('../database/database');
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({accessKeyId: nconf.get('aws:aws-id'), secretAccessKey: nconf.get('aws:aws-secret'), region: nconf.get('aws:region')});
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var mailer = require('../utils/mailer');

db.once('open', function callback () {
  var app = new Consumer({
    queueUrl: nconf.get('aws:queue-url'),
    region: nconf.get('aws:region'),
    sqs: sqs,
    handleMessage: function (message, done) {
      user_id = JSON.parse(message.Body).userID;

      async.parallel({
        posts: function(callback) {
          Post.find({author: user_id}).sort({'date':-1}).limit(5).exec(callback);
        },
        user: function(callback) {
          User.findOne({id: user_id}, callback);
        }
      }, function(err, results) {
        if (err) {
          logger.error(err)
          return done(err);
        }
        mailer.sendDigest(results.posts,results.user, function(err) {
          if(err) {
            done(err);
          }
          done();
        })
      });
    }
  });
  app.start();
});