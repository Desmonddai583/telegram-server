var routes = exports;

routes.generateRoutes = function(app) {
  require('./users')(app)
  require('./posts')(app)
  require('./auth')(app)
}