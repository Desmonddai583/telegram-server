var mongoose = require('mongoose');

module.exports = mongoose.Schema({
  body: String,
  date: {type: Date, default: Date.now},
  receiver: String,
  sender: String,
  isRead: { type: Boolean, default: true },
});