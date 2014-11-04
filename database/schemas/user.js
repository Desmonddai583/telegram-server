var mongoose = require('mongoose');

module.exports = mongoose.Schema({
  id: String,
  name: String,
  password: String,
  email: String,
  photo: String,
  token: String,
  isPro: { type: Boolean, default: false },
  stripeToken: String,
  followers: {type: [String], default: []},
  following: {type: [String], default: []}
});