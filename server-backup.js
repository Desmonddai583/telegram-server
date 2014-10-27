var express = require('express');
var async = require("async");
var bodyParser = require('body-parser');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var flash = require('connect-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var bcrypt = require('bcrypt');
var api_key = 'key-e2a50d6091c24a46f1a5d047ceebbae5';
var domain = 'sandbox6cee921710e44a21ae485a9555b7229a.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
var md5 = require('MD5');
var fs = require('fs');
var jade = require('jade');
var app = express();

app.set('view engine', 'jade');
app.set('views', __dirname + "/views" );

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'desmond.dai',
                  cookie: { maxAge: 60000 },
                  saveUninitialized: true,
                  resave: true
                }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

mongoose.connect('mongodb://localhost/telegram');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {});
autoIncrement.initialize(db);

var userSchema = mongoose.Schema({
  id: String,
  name: String,
  password: String,
  email: String,
  photo: String,
  followers: {type: [String], default: []},
  following: {type: [String], default: []}
});

var postSchema = mongoose.Schema({
  body: String,
  date: {type: Date, default: Date.now},
  author: String
});

var User = mongoose.model('User', userSchema);
postSchema.plugin(autoIncrement.plugin, 'Post');
var Post = mongoose.model('Post', postSchema);

function findById(id, callback) {
  User.findOne({'id': id}, callback);
}

function validateUser(user, password, callback) {
  if (user) { 
    bcrypt.compare(password, user.password, function(err, res) {
      if (res) {
        callback(null, user);
      } else {
        callback(null, false, { message: 'Invalid credential, please check your username and password.' });
      }
    });
  } else {
    callback(null, false, { message: 'Invalid credential, please check your username and password.' });
  }  
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(403).end();  
}

function emberUser(user, current_user) {
  var newUser = {id: user.id, name: user.name, photo: user.photo};
  if (current_user) {
    if (user.followers && user.followers.indexOf(current_user.id) >= 0) {
      newUser.isFollowedByCurrentUser = true;
    }
  }
  return newUser;
}

function makePasswd(n, a) {
  var index = (Math.random() * (a.length - 1)).toFixed(0);
  return n > 0 ? a[index] + makePasswd(n - 1, a) : '';
};

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'password'
  },
  function(username, password, done) {
    async.waterfall([
      function(callback) {
        findById(username, callback); 
      },
      function(user,callback) {
        validateUser(user, password, callback);
      }
    ], function(err, user, info) {
      if (err) {
        return done(err);
      }
      return done(err, user, info);  
    });
  }
));

app.get('/api/users', function(req,res,next) {
    if (req.query.isAuthenticated) {
      if(req.isAuthenticated()){
        return res.status(200).send({'users': [req.user]});
      }
      else{
        return res.status(200).send({'users': []});
      }
    }
    else if (req.query.operation === 'login') {
      passport.authenticate('local', function(err, user, info) {
        if (err) { return res.status(500).end(); }
        if (!user) { return res.status(400).send(info.message); } 
        req.logIn(user, function(err) {
          return res.status(200).send({"users": [emberUser(user)]});
        }); 
      })(req, res, next)
    }
    else if (req.query.operation === 'followers') {
      User.find({following: req.query.user}, function(err, followers){
        var users = [];
        followers.forEach(function(user) {
          users.push(emberUser(user,req.user));
        }); 
        res.status(200).send({'users': users});
      });
    }
    else if (req.query.operation === 'following') {
      User.find({followers: req.query.user}, function(err, following){
        var users = [];
        following.forEach(function(user) {
          users.push(emberUser(user,req.user));
        }); 
        res.status(200).send({'users': users});
      });
    }
});

app.get('/api/users/:user_id', function(req,res) {
  findById(req.params.user_id, function(err, user) {
    if (err) { return res.status(500).end(); }
    if (!user) { return res.status(400).send("Can not found the user"); }
    res.status(200).send({"user": emberUser(user,req.user)});
  });
});

app.post('/api/users/', function(req,res) {
  var object = req.body.user;

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(object.password, salt, function(err, hash) {
      var newUser = new User({ id: object.id, password: hash, name: object.name, email: object.email, photo: 'images/avatar1.png' });
      newUser.save(function (err, user) {
        if (err) return console.error(err);
        req.logIn(newUser, function(err) {
          return res.status(200).send({"users": [emberUser(newUser)]});
        });
      });
    });
  });
});

app.post('/api/follow/', function(req,res) {
  var follow = req.body.followingID;

  async.parallel([
    function(callback) {
     User.update({id: req.user.id}, {$push: {following: follow}}, function(err){
      if(err) { return console.log(err); }
      callback(err);
     });     
    },
    function(callback) {
     User.update({id: follow}, {$push: {followers: req.user.id}}, function(err){
      if(err) { return console.log(err); }
      callback(err);
     });   
    }
  ], function(err) {
    if (err) return res.status(500).end();
    res.status(200).end();
  });
});

app.post('/api/unfollow/', function(req,res) {
  var unfollow = req.body.unfollowingID;

  async.parallel([
    function(callback) {
      User.update({id: req.user.id}, {$pull: {following: unfollow}}, function(err){
        if(err) { return console.log(err); }
        callback(err);
      });  
    },
    function(callback) {
      User.update({id: unfollow}, {$pull: {followers: req.user.id}}, function(err){
        if(err) { return console.log(err); }
        callback(err);
      }); 
    }
  ], function(err) {
    if (err) return res.status(500).end();
    res.status(200).end();
  });
});

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

app.post('/api/posts/', ensureAuthenticated, function(req,res) {
  var object = req.body.post;

  var newPost = new Post({ body: object.body, author: object.author });
  newPost.save(function (err, post) {
    if (err) return console.error(err);
    res.status(200).send({'post': post});
  });
});

app.delete('/api/posts/:post_id', ensureAuthenticated, function(req,res) {
  Post.find({'_id': req.params.post_id}).remove(function(err,post) {
    if (err) return console.error(err);
    res.status(200).send({});
  })
});

app.post('/api/resetPassword/', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user){
    if (err) return console.error(err);
    if (!user) { return res.status(400).send("The user does not exist!"); }
    var password = makePasswd(13, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');
    var MD5Password = md5(password);

    async.waterfall([
      function(callback) {
        bcrypt.genSalt(10, callback);
      },
      function(salt, callback) {
        bcrypt.hash(MD5Password, salt, callback);
      },
      function(hash, callback) {
        User.findOneAndUpdate({email: req.body.email}, {$set: {password: hash}}, callback);
      },
    ], function(err, user) {
      fs.readFile('templates/emails/send-reset-password.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var fn = jade.compile(data);
        var html = fn({password: password});

        var data = {
          from: 'desmonddai583@gmail.com',
          to: user.email,
          subject: 'Reset Password',
          html: html
        };
        mailgun.messages().send(data, function(err, body) {
          if (err) return console.error(err);
          res.status(200).send({});
        });
      });      
    });  
  });
});

app.get('/api/logout', function(req, res){
  req.logout();
  res.status(200).end();
});

var server = app.listen(9000, function() {
  console.log('Listening on port %d', server.address().port);
})