var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
  id: String,
  name: String,
  password: String,
  email: String,
  photo: String,
  token: String,
  isPro: { type: Boolean, default: false },
  stripeCustomerID: String,
  followers: {type: [String], default: []},
  following: {type: [String], default: []}
});

userSchema.methods.emberUser = function(current_user) {
  var newUser = {id: this.id, name: this.name, email: this.email, photo: this.photo, isPro: this.isPro};
  if (current_user) {
    if (this.followers && this.followers.indexOf(current_user.id) >= 0) {
      newUser.isFollowedByCurrentUser = true;
    }
  }
  return newUser;
}

userSchema.statics.generateToken = function(n, a) {
  var index = (Math.random() * (a.length - 1)).toFixed(0);
  return n > 0 ? a[index] + this.generateToken(n - 1, a) : '';
};

userSchema.statics.findByUserId = function(id, callback) {
  this.findOne({'id': id}, callback);
}

userSchema.statics.hashPassword = function(object, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(object.password, salt, callback);
  });
};

module.exports = userSchema;