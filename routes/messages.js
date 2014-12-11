var express = require('express');
var router = express.Router();
var async = require("async");
var mongoose = require('mongoose');
var logger = require('nlogger').logger(module);
var Message = mongoose.model('Message');
var User = mongoose.model('User');
var ensureAuthenticated = require('../middleware/ensureAuthenticated');

router.get('/', ensureAuthenticated, function(req,res) {
  handleMessagesRequest(req, res);
});

function handleMessagesRequest(req, res) {
  async.parallel({
    messages: function(callback) {
      Message.find({$or : [{receiver: req.query.user, sender: req.user.id}, {receiver: req.user.id, sender: req.query.user}]}, callback);
    },
    users: function(callback) {
      User.find({id: {$in: [req.query.user, req.user.id]}}, callback);
    }
  }, function(err, results) {
    if (err) {
      logger.error(err);
      return res.status(500).send(err.message);
    }
    var users = results.users.map(function(user) { return user.emberUser(req.user); });
    res.status(200).send({'messages': results.messages, 'users': users});
  });
};

module.exports = router;