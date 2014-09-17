var express = require('express');
var app = express();

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
  username = req.query.id;
  password = req.query.password;
  var user;

  for(var i=0; i < users.length; i++) {
    if(users[i].id == username && users[i].password == password) {
      user = users[i];
      break;
    }
  }
  res.send({"user": user});
});

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
})