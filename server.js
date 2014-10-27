var express = require('express');
var app = express();

var expressConfig = require('./middleware/express-config');
expressConfig.initializeConfig(app);

var mongooseConfig = require('./database/database');
mongooseConfig.initializeMongooseConfig();

var passportConfig = require('./middleware/passport');
passportConfig.initializePassportConfig();

var routes = require('./routes/index');
routes.generateRoutes(app);

var server = app.listen(9000, function() {
  console.log('Listening on port %d', server.address().port);
})
