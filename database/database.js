var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var userSchema = require('./schemas/user');
var postSchema = require('./schemas/post');

module.exports = function() {
  mongoose.connect('mongodb://localhost/telegram');

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {});
  autoIncrement.initialize(db);
  db.model('User', userSchema);
  postSchema.plugin(autoIncrement.plugin, 'Post');
  db.model('Post', postSchema);  

  return db;
}

