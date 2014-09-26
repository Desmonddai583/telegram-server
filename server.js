var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost.com');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

app.get('/api/users', function(req,res) {
  if (req.query.operation === 'login') {
    username = req.query.id;
    password = req.query.password;
    var user = {};

    for(var i=0; i < users.length; i++) {
      if(users[i].id == username && users[i].password == password) {
        user = users[i];
        break;
      }
    }
    res.send({"users": [user]});
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