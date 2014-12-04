var express = require('express');
var nconf = require('../config/nconf-config');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongostore')(session);
var cookieParser = require('cookie-parser');
var passport = require('passport');
var jade = require('jade');
var app = express();

module.exports = function(app) {
  app.set('view engine', 'jade');
  app.set('views', __dirname + "/views" );

  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(session({ secret: 'desmond.dai',
                    cookie: { maxAge: 300000000 },
                    saveUninitialized: true,
                    resave: true,
                    store: new MongoStore({'db': nconf.get('mongoStore:database')})
                  }));
  app.use(passport.initialize());
  app.use(passport.session());
  return app;
}