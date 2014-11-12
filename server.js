var express = require('express');
var app = express();
var nconf = require('./config/nconf-config');
var expressConfig = require('./middleware/express-config')(app);
var db = require('./database/database');
var passportConfig = require('./middleware/passport');
var router = require('./routes/index')(app);

db.once('open', function callback () {
  var server = app.listen(nconf.get('port'), function() {
    console.log('Listening on port %d', server.address().port);
  });
});