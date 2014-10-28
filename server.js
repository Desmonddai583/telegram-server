var express = require('express');
var app = express();
var expressConfig = require('./middleware/express-config')(app);
var mongooseConfig = require('./database/database')();
var passportConfig = require('./middleware/passport')();

var router = require('./routes/index')(app);

var server = app.listen(9000, function() {
  console.log('Listening on port %d', server.address().port);
})
