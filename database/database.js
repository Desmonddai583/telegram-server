var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var user = require('./schemas/user');
var post = require('./schemas/post');

var mongooseConfig = exports;

mongooseConfig.initializeMongooseConfig = function() {
  mongoose.connect('mongodb://localhost/telegram');

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {});
  autoIncrement.initialize(db);

  db.model('User', user.userSchema);
  post.postSchema.plugin(autoIncrement.plugin, 'Post');
  db.model('Post', post.postSchema);  
}

