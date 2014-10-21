var express = require('express');
var async = require("async");
var bodyParser = require('body-parser');
var passport = require('passport')
, LocalStrategy = require('passport-local').Strategy
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
var app = express();

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
  followers: {type: String, default: []},
  following: {type: String, default: []}
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(403).end();  
}

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
    findById(username, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Invalid credential, please check your username and password.' }); }
      bcrypt.compare(password, user.password, function(err, res) {
        if (err) { return done(err); }
        if (res) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid credential, please check your username and password.' });
        }
      });   
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
          return res.status(200).send({"users": [user]});
        }); 
      })(req, res, next)
    }
    else if (req.query.operation === 'followers') {
      User.find({following: req.query.user}, '-password', function(err, followers){
        followers.forEach(function(user, index, self) {
          if (req.user) {
            self[index] = self[index].toObject();
            if (self[index].followers && self[index].followers.indexOf(req.user.id) >= 0) {
              self[index].isFollowedByCurrentUser = true;
            }
          }
        }); 
        res.status(200).send({'users': followers});
      });
    }
    else if (req.query.operation === 'following') {
      User.find({followers: req.query.user}, '-password', function(err, following){
        following.forEach(function(user, index, self) {
          if (req.user) {
            self[index] = self[index].toObject();
            if (self[index].followers && self[index].followers.indexOf(req.user.id) >= 0) {
              self[index].isFollowedByCurrentUser = true;
            }
          }
        }); 
        res.status(200).send({'users': following});
      });
    }
});

app.get('/api/users/:user_id', function(req,res) {
  findById(req.params.user_id, function(err, user) {
    if (err) { return res.status(500).end(); }
    if (!user) { return res.status(400).send("Can not found the user"); }
    if (req.user) {
      user = user.toObject();
      if (user.followers && user.followers.indexOf(req.user.id) >= 0) {
        user.isFollowedByCurrentUser = true;
      }
    }
    res.status(200).send({"user": user});
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
          return res.status(200).send({"users": [newUser]});
        });
      });
    });
  });
});

app.post('/api/follow/', function(req,res) {
  var follow = req.body.followingID;

  User.update({id: req.user.id}, {$push: {following: follow}}, function(err){
    if(err) { return console.log(err); }
  });

  User.update({id: follow}, {$push: {followers: req.user.id}}, function(err){
    if(err) { return console.log(err); }
  });

  res.status(200).end();
});

app.post('/api/unfollow/', function(req,res) {
  var unfollow = req.body.unfollowingID;

  User.update({id: req.user.id}, {$pull: {following: unfollow}}, function(err){
    if(err) { return console.log(err); }
  });

  User.update({id: unfollow}, {$pull: {followers: req.user.id}}, function(err){
    if(err) { return console.log(err); }
  });

  res.status(200).end();
});

app.get('/api/posts', function(req,res) {
  if (req.query.operation === 'userPosts') {
    Post.find({author: req.query.author}).sort({'date':-1}).exec(function(err, posts){ 
      res.status(200).send({'posts': posts});
    });
  } 
  else if (req.query.operation === 'dashboardPosts') {
    User.find({followers: req.user.id}, function(err, users){
      var userIds = [];
      users.forEach(function(user) {
        userIds.push(user.id);
      });
      Post.find({$or: [ {author: req.user.id}, {author: {$in: userIds}} ]}).sort({'date':-1}).exec(function(err, posts){ 
        res.status(200).send({'posts': posts});
      });
    });
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

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(MD5Password, salt, function(err, hash) {
        User.findOneAndUpdate({email: req.body.email}, {$set: {password: hash}}, function(err, user){
          var data = {
            from: 'desmonddai583@gmail.com',
            to: user.email,
            subject: 'Reset Password',
            html: "<body><p>Your new password is: <strong>" + password + "</strong></p></body>"
          };
          mailgun.messages().send(data, function(err, body) {
            if (err) return console.error(err);
            res.status(200).send({});
          });
        });
      });
    });    
  });
  // TODO 
  // User.findOne({email: req.body.email}, function(err, user){
  //   if (err) return console.error(err);
  //   if (!user) { return res.status(400).send("The user does not exist!"); }
  //   var data = {
  //     from: 'desmonddai583@gmail.com',
  //     to: user.email,
  //     subject: 'Reset Password',
  //     html: "<body><p>Please click the link below to reset your password:</p><p><a href='" + req.protocol + "://" + req.get('host') + "'>Reset My Password</a></p></body>"
  //   };
  //   mailgun.messages().send(data, function (err, body) {
  //     if (err) return console.error(err);
  //     console.log(body);
  //   });
  // });
});

function makePasswd(n, a) {
  var index = (Math.random() * (a.length - 1)).toFixed(0);
  return n > 0 ? a[index] + makePasswd(n - 1, a) : '';
};

app.get('/api/logout', function(req, res){
  req.logout();
  res.status(200).end();
});

var server = app.listen(9000, function() {
  console.log('Listening on port %d', server.address().port);
})