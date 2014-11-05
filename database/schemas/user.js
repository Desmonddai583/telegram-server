var mongoose = require('mongoose');

module.exports = mongoose.Schema({
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