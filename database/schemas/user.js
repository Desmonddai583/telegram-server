var mongoose = require('mongoose');

var user = exports;

user.userSchema = mongoose.Schema({
  id: String,
  name: String,
  password: String,
  email: String,
  photo: String,
  token: String,
  followers: {type: [String], default: []},
  following: {type: [String], default: []}
});