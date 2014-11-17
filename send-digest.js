var logger = require('nlogger').logger(module);
var CronJob = require('cron').CronJob;
var mongoose = require('mongoose');
var SQS = require('aws-sqs');
var nconf = require('./config/nconf-config');
var db = require('./database/database');
var sqs = new SQS(nconf.get('aws:aws-id'), nconf.get('aws:aws-secret'));
var User = mongoose.model('User');

db.once('open', function callback () {
  var job = new CronJob('* * * * * *', function() {
    User.find({isPro: true}, function(err, users){
      if (err) logger.error(err);
      users.forEach(function(user) {
        sqs.sendMessage('/410293358835/sendDigest', JSON.stringify({userID: user.id, workType: 'digest'}), function(err, res) {
          if(err) {
            logger.error(err);
          }
          logger.info(res)
        });
      }); 
    });
  }, function () {
    logger.info('Sending digest to Pro accounts is completed!');
  }, true);
});






