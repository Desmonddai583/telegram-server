var mongoose = require('mongoose');
var userUtil = require('../utils/user-utils');
var Post = mongoose.model('Post');

module.exports = function (app) {
  app.get('/api/posts', function(req,res) {
    if (req.query.operation === 'userPosts') {
      Post.find({author: req.query.author}).sort({'date':-1}).exec(function(err, posts){ 
        res.status(200).send({'posts': posts});
      });
    } 
    else if (req.query.operation === 'dashboardPosts') {
      if (req.isAuthenticated()) {
        req.user.following.push(req.user.id)
        var relatedUsers = req.user.following
        Post.find({author: {$in: relatedUsers}}).sort({'date':-1}).exec(function(err, posts){ 
          res.status(200).send({'posts': posts});
        });
      }
    }
  });

  app.post('/api/posts/', userUtil.ensureAuthenticated, function(req,res) {
    var object = req.body.post;

    var newPost = new Post({ body: object.body, author: object.author });
    newPost.save(function (err, post) {
      if (err) return console.error(err);
      res.status(200).send({'post': post});
    });
  });

  app.delete('/api/posts/:post_id', userUtil.ensureAuthenticated, function(req,res) {
    Post.find({'_id': req.params.post_id}).remove(function(err,post) {
      if (err) return console.error(err);
      res.status(200).send({});
    })
  });
}