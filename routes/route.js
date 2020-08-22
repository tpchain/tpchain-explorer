var express = require('express');
var routes = require('./server');
var app = express();

var session = require('express-session');

// session.saveUninitialized = 30;
module.exports = function (app) {
	app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 3000000 } }))
	app.use('/', routes);
	app.use(express.static(__dirname + '/static'));
}
