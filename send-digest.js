var logger = require('nlogger').logger(module);
var CronJob = require('cron').CronJob;
var SQS = require('aws-sqs');
var sqs = new SQS('AKIAI6D7YGM45PYLHS6A', '42zLfXr/jErpyM4+lZFMriU+aBUPjkUyqpGMDwSc');

var job = new CronJob('0 0 8 * * *', function(){
    sqs.sendMessage('/410293358835/sendDigest', 'hello', function(err, res) {
      if(err) {
        logger.error(err);
      }
      logger.info(res);
    });
  }, function () {
    logger.info('Cron job execution is completed!');
  },
  true
);




