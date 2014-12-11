var routes = exports;

module.exports = function(app) {
  app.use('/api/users', require('./users'));
  app.use('/api/posts', require('./posts'));
  app.use('/api/auth', require('./auth'));
  app.use('/api/messages', require('./messages'));
}