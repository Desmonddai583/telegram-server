var logger = require('nlogger').logger(module);
var SQS = require('aws-sqs');
var sqs = new SQS('AKIAI6D7YGM45PYLHS6A', '42zLfXr/jErpyM4+lZFMriU+aBUPjkUyqpGMDwSc');

sqs.sendMessage('/410293358835/sendDigest', {}, function(err, res) {
  if(err) {
    logger.error(err);
  }
  logger.info(res);
});