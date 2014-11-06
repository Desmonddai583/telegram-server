var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var logger = require('nlogger').logger(module);
var userUtil = require('../utils/user-utils');
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

  var newPost = new Post({ body: object.body, author: object.author, originalAuthor: object.originalAuthor });
  newPost.save(function (err, post) {
    if (err) return logger.error(err);
    res.status(200).send({'post': post});
  });
});

router.delete('/:post_id', ensureAuthenticated, function(req,res) {
  Post.find({'_id': req.params.post_id}).remove(function(err,post) {
    if (err) return logger.error(err);
    res.status(200).send({});
  })
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
    req.user.following.push(req.user.id)
    var relatedUsers = req.user.following
    User.find({id: {$in: relatedUsers}}, function(err, users) {
      Post.find({author: {$in: relatedUsers}}).sort({'date':-1}).exec(function(err, posts) { 
        var newUsers = [];
        users.forEach(function(user) {
          newUsers.push(userUtil.emberUser(user,req.user));
        }); 
        res.status(200).send({'posts': posts, 'users': newUsers});
      });    
    });
  }
};

module.exports = router;