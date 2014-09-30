var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport')
, LocalStrategy = require('passport-local').Strategy
var flash = require('connect-flash')
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var users = [
  {
    id: 'desmond',
    password: '098567',
    name: 'Desmond Dai',
    email: 'desmonddai583@gmail.com',
    photo: 'images/avatar.png',
  },
  {
    id: 'linda',
    password: '098567',
    name: 'Linda Ng',
    email: 'lindalam583@gmail.com',
    photo: 'images/avatar1.png',
  }
]

var posts = [
    {
      id: 1,
      body: 'This is a post test1! This is a post test1! This is a post test1!',
      date: new Date(2014, 9, 12),
      author: 'desmond',
    },
    {
      id: 2,
      body: 'This is a post test2! This is a post test2! This is a post test2!',
      date: new Date(2014, 9, 3),
      author: 'desmond',
    },
    {
      id: 3,
      body: 'This is a post test3! This is a post test3! This is a post test3!',
      date: new Date(2014, 9, 11),
      author: 'linda',
    },
    {
      id: 4,
      body: 'This is a post test4! This is a post test4! This is a post test4!',
      date: new Date(2014, 9, 1),
      author: 'linda',
    }
]

function findById(id, callback) {
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (user.id === id) {
      return callback(null, user);
    }
  }
  return callback(null, null);
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
      if (user.password != password) { return done(null, false, { message: 'Invalid credential, please check your username and password.' });}
      return done(null, user);
    })
  }
));

app.get('/api/users', function(req,res,next) {
    if (req.query.operation === 'login') {
      passport.authenticate('local', function(err, user, info) {
        if (err) { return res.send(500); }
        if (!user) { return res.send(400, info.message); } 
        req.logIn(user, function(err) {
          return res.send({"users": [user]});
        }); 
      })(req, res, next)
    }
    else {
      res.send({"users": users});
    }
});

app.get('/api/users/:user_id', function(req,res) {
  var user;
  for(var i=0; i < users.length; i++) {
    if(users[i].id == req.params.user_id) {
      user = users[i];
      break;
    }
  }
  res.send({"user": user});
});

app.post('/api/users/', function(req,res) {
  var object = req.body.user;
  var newUser = { id: object.id, password: object.password, name: object.name, email: object.email, photo: 'images/avatar1.png' }
  users.push(newUser);

  res.send({user: newUser});
});

app.get('/api/posts', function(req,res) {
  if (req.query.operation === 'userPosts') {
    var author = req.query.author;
    var userPosts = [];
    for(var i=0; i < posts.length; i++) {
      if(posts[i].author == author) {
        userPosts.push(posts[i]);
      }
    }
    res.send({"posts": userPosts});
  } 
  else {
    res.send({"posts": posts});
  }
});

app.post('/api/posts/', function(req,res) {
  var object = req.body.post;
  var newPost = { id: posts.length + 1, body: object.body, date: Date.parse(object.date), author: object.author }
  posts.push(newPost);

  res.send({post: newPost});
});

app.delete('/api/posts/:post_id', function(req,res) {
  for(var i=0; i < posts.length; i++) {
    if(posts[i].id == req.params.post_id) {
      posts.splice(i, 1);
      break;
    }
  }
});

var server = app.listen(9000, function() {
  console.log('Listening on port %d', server.address().port);
})