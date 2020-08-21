var express = require('express');
var app = express();
var routes = require('./routes/route')(app);
var path = require('path');
console.log('Listening on port 8000');
app.use(express.static(path.join(__dirname, 'static')));
app.listen(8000);