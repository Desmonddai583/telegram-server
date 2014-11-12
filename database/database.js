var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var nconf = require('../config/nconf-config');
var userSchema = require('./schemas/user');
var postSchema = require('./schemas/post');

function defaultConnection() {
  mongoose.connect('mongodb://' + nconf.get('mongodb:host') + '/' + nconf.get('mongodb:database'));

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  autoIncrement.initialize(db);
  db.model('User', userSchema);
  postSchema.plugin(autoIncrement.plugin, 'Post');
  db.model('Post', postSchema);  

  return db;
}

module.exports = defaultConnection();

