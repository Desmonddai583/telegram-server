var mongoose = require('mongoose');

module.exports = mongoose.Schema({
  body: String,
  date: {type: Date, default: Date.now},
  author: String,
  originalAuthor: String
});