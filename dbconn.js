var mongo = require('mongodb');
var mongoose = require('mongoose');
var keys = require('./keys.json');

//builds a connection to the database and makes it available to any file that requires this file

mongoose.connect('mongodb://localhost/' + keys.databaseName, {useNewUrlParser: true, useUnifiedTopology: true, user: keys.databaseUser, pass: keys.databasePassword, authSource:'admin'});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Database created!");
});

module.exports = db;