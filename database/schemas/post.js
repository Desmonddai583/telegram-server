var mongoose = require('mongoose');

var post = exports;

post.postSchema = mongoose.Schema({
  body: String,
  date: {type: Date, default: Date.now},
  author: String
});