var express = require('express');
var router = express.Router();
var async = require("async");
var mongoose = require('mongoose');
var logger = require('nlogger').logger(module);
var Post = mongoose.model('Post');
var User = mongoose.model('User');

router.get('/', function(req,res) {
  if (req.query.operation === 'userPosts') {
    handleUserPostsRequest(req, res);
  } 
  else if (req.query.operation === 'dashboardPosts') {
    handleDashboardPostsRequest(req, res);
  }
});

router.post('/', ensureAuthenticated, function(req,res) {
  var object = req.body.post;

  Post.create({ body: object.body, author: object.author, originalAuthor: object.originalAuthor }, function (err, post) {
    if (err) return logger.error(err);
    res.status(200).send({'post': post});
  })
});

router.delete('/:post_id', ensureAuthenticated, function(req,res) {
  Post.findByIdAndRemove(req.params.post_id, {}, function(err,post) {
    if (err) return logger.error(err);
    res.status(200).send({});
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(403).end();  
}

function handleUserPostsRequest(req, res) {
  Post.find({author: req.query.author}).sort({'date':-1}).exec(function(err, posts){ 
    res.status(200).send({'posts': posts});
  });
};

function handleDashboardPostsRequest(req, res) {
  if (req.isAuthenticated()) {
    req.user.following.push(req.user.id);
    var relatedUsers = req.user.following;

    async.parallel({
      users: function(callback) {
        User.find({id: {$in: relatedUsers}}, callback);
      },
      posts: function(callback) {
        Post.find({author: {$in: relatedUsers}}).sort({'date':-1}).exec(callback);
      }
    }, function(err, results) {
      if (err) {
        logger.error(err);
        return res.status(500).send(err.message);
      }
      var newUsers = [];
      results.users.forEach(function(user) {
        newUsers.push(user.emberUser(req.user));
      }); 
      res.status(200).send({'posts': results.posts, 'users': newUsers});
    });
  }
};

module.exports = router;