"use strict"
//To launch: sudo nodejs hello\ worldode.js
//Visit hello world.html to run from the browser.

var root = "/var/www"
var port = "8080"

var app = require('http').createServer();
var io = require('socket.io').listen(app);
var fs = require('fs');

io.set('transports', ['websocket']);
io.set('log level', 2);

var c = console;

c.log('Caching filesystem at ' + root + '. This may take a moment…');
var numCached = 0;
var lastReportedCache = 0;
var parseFS = function parse(path, cache) {
	if(numCached > lastReportedCache + 1000) {
		c.log(''+numCached+' files cached…')
		lastReportedCache += 1000;
	}
	return fs.readdirSync(
			root+path
		).map(function(fname) { return {
			data: fs.statSync(root+path+fname),
			name: fname,
			path: path,
		}; }).filter(function(fstat) {
			return fstat.name[0] !== '.' && (fstat.data.isDirectory() || fstat.data.isFile());
		}).sort(function(fstatA, fstatB) {
			return fstatA.data.isFile() + fstatA.name.toLocaleLowerCase() > fstatB.data.isFile() + fstatB.name.toLocaleLowerCase() ? 1 : -1;
		}).map(function(fstat) {
			numCached++;
			if(fstat.data.isDirectory()) {
				var dir = parseFS(path+fstat.name+'/', []);
				dir.name = fstat.name;
				dir.url = fstat.path+fstat.name;
				dir.type = 'folder';
				return dir;
			} else {
				return {
					name: fstat.name,
					url: fstat.path+fstat.name,
					type: 'file',
				}
			}
		});
	};
var fileSystem = parseFS('/', []);
fileSystem.type = 'folder';
fileSystem.name = '~';
fileSystem.url = '/';
c.log(''+numCached+' files cached.')

c.log('Listening on port '+port+'.')
app.listen(port);

io.sockets.on('connection', function (socket) {
	socket.on('request file', function (path) {		
		var layer = getLayer(path);
		var obj = {}; //To return.
		
		c.log('   req   - ', {
			type: 'file request:', 
			path: layer.url,
			time: Math.round(new Date().getTime()/1000),
		})
		
		if(layer.type === 'folder') {
			obj = {
				name: layer.name,
				url: layer.url,
				type: layer.type,
				contents: layer,
			}
		} else {
			obj = layer;
		}
		obj.path = path;
		
		//setTimeout(function() { //For testing! It is, indeed, much worse with two seconds of lag.
		//	socket.emit('file data', obj);
		//}, 2000);
		socket.emit('file data', obj);
	});
});

var getLayer = function(path) {
	function unpackLayers(lobj, path) { //Returns the layer object the path is pointing at.
		if(path.length) {
			return unpackLayers(lobj[path[0]], path.slice(1)); //lobj = layer object, be it a window, folder, or canvas
		} else {
			return lobj;
		}
	};
	var layer = unpackLayers(fileSystem, path);
	if(layer.type === 'folder') { //Don't send sub-folder contents, for bandwidth's sake.
		var renderedLayer = layer.map(function(directoryEntry) {return {
			name: directoryEntry.name, 
			url: directoryEntry.url,
			type: directoryEntry.type,
		}});
		renderedLayer.name = layer.name;
		renderedLayer.url = layer.url;
		renderedLayer.type = layer.type;
		return renderedLayer;
	} else {
		return layer;
	};
};
