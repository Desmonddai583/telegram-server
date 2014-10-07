var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport')
, LocalStrategy = require('passport-local').Strategy
var flash = require('connect-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat',
                  cookie: { maxAge: 60000 },
                  saveUninitialized: true,
                  resave: true
                }));
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
];

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
];

var posts_length = posts.length;

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
    if (req.query.isAuthenticated) {
      if(req.isAuthenticated()){
        return res.status(200).send({users: [req.user]});
      }
      else{
        return res.status(200).send({users: []});
      }
    }
    else if (req.query.operation === 'login') {
      passport.authenticate('local', function(err, user, info) {
        if (err) { return res.status(500).end(); }
        if (!user) { return res.status(400).send(info.message); } 
        req.logIn(user, function(err) {
          return res.send({"users": [user]});
        }); 
      })(req, res, next)
    }
    else {
      res.status(200).send({"users": users});
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
  res.status(200).send({"user": user});
});

app.post('/api/users/', function(req,res) {
  var object = req.body.user;
  var newUser = { id: object.id, password: object.password, name: object.name, email: object.email, photo: 'images/avatar1.png' }
  users.push(newUser);

  res.status(200).send({user: newUser});
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
    res.status(200).send({"posts": userPosts});
  } 
  else {
    res.status(200).send({"posts": posts});
  }
});

app.post('/api/posts/', function(req,res) {
  var object = req.body.post;
  if (req.user.id === object.author) {
    var newPost = { id: posts_length + 1, body: object.body, date: Date.parse(object.date), author: object.author }
    posts_length++;
    posts.push(newPost);
    res.status(200).send({post: newPost});
  } else {
    res.status(400).end();
  }
});

app.delete('/api/posts/:post_id', function(req,res) {
  for(var i=0; i < posts.length; i++) {
    if(posts[i].id === parseInt(req.params.post_id)) {
      if (req.user.id === posts[i].author) {
        posts.splice(i, 1);
        break;
      } else {
        res.status(400).end();
      }
    }
  }
  res.status(200).end();
});

var server = app.listen(9000, function() {
  console.log('Listening on port %d', server.address().port);
})