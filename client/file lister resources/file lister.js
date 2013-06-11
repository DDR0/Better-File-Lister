"use strict";
var previewableExtentions = ['html', 'htm', 'shtml', 'xhtml', 'css', 'xml', 'gif', 'jpeg', 'jpg', 'js', 'txt', 'png', 'bmp', 'svg', 'svgz', 'json', 'weba', 'webm', ];

var c = console;

(function(global) {
	var status = $('#status')[0];
	global.msg = function(msg) {
		console.info(msg);
		status.innerHTML = msg;
	};
	global.warn = function(msg) {
		console.warn(msg);
		status.innerHTML = msg;
	};
})(this);

var requestFile = function(path) {
	msg('Requested file @ ' + JSON.stringify(path) + '.');
	socket.emit('request file', path);
};

var box = $('#file-list')[0];
msg('Connecting to fileserver…');

var socket = io.connect(window.location.origin);
socket.on('connect', function () {
	msg('Established websocket connection to fileserver.');
	
	expand([]);
	
	socket.on('file data', function (data) {
		addFileToFS(data);
	});
});

socket.on('reconnecting', function () {warn('Lost connection to file server…')});
socket.on('reconnect', function () {msg('Reconnected to fileserver.')});
socket.on('connect_failed', function () {warn('Could not connect to file server.')});
socket.on('reconnect_failed', function () {warn('Could not reconnect to file server.')});
socket.on('error', function () {warn('Something or other has gone wrong with the websocket connection.')});


(function(global) {
	var fileSystem = []; //Or "FS".
	fileSystem.type = 'folder';
	fileSystem.path = [];
	fileSystem.url = '/';
	fileSystem.name = '~';
	
	//global.markOpen  = function(path) {getLayer(fileSystem, path).isOpen = true;};
	//global.markClose = function(path) {getLayer(fileSystem, path).isOpen = false;};
	//markLoaded       = function(path) {getLayer(fileSystem, path).isLoaded = true;};
	//markUnloaded     = function(path) {getLayer(fileSystem, path).isLoaded = false;};
	
	global.expand = function(path) {
		var layer = getLayer(path);
		if(!layer.isOpen) {
			layer.isOpen = true;
			if(!layer.isLoaded && layer.type === 'folder') {
				requestFile(path);
			} else {
				layer.isLoaded = true;
			}
			renderFS()
		}
	};
	
	global.collapse = function(path) {
		var layer = getLayer(path);
		if(layer.isOpen) {
			layer.isOpen = false;
			renderFS()
		}
	}
	
	
	global.addFileToFS = function(data) {
		msg('Received file.');
		var layer = getLayer(data.path);
		layer.length = 0; //We clear the existing object because we don't want to loose any data already set on it.
		if(data.type === 'folder') {
			layer.__proto__ = []; //The existing folder object needs array functions to be able to cope with its future files.
			data.contents.forEach(function(val, index) {
				val.path = data.path.concat([index]); 
				layer.push(val); 
			});
		} else {
			c.log('do loading data for', data);
		}
		layer.isLoaded = true;
		renderFS() //Render here so we can have the classes updated right for loaded status.
	};
	
	var renderFS = function() {
		function fs2str(fs) { //file-system to string
			var str = '<ul>';
			fs.isLoaded && fs.forEach(function(entry) {
				str += '<li>';
				if(entry.type === 'folder' || _.contains(previewableExtentions, entry.name.slice(entry.name.indexOf('.')+1)) ) {
					if(entry.isOpen) {
						str += "<button class=\"" + 
							(entry.isLoaded ? "loaded" : "loading") + 
							"\" onclick=\"collapse("+
							JSON.stringify(entry.path) +
							")\">-</button>";
					} else {
						str += "<button class=\"" + 
							(entry.isLoaded ? "loaded" : "unloaded") + 
							"\" onclick=\"expand("+
							JSON.stringify(entry.path) +
							")\">+</button>";
					}
				}
				if(entry.type === 'folder') {
					str += entry.name;
				} else {
					str += "<a href=\""+entry.url+"\">"+entry.name+"</a>";
				}
				if(entry.isOpen) {
					switch(entry.type) {
					case 'folder':
						str += fs2str(entry);
						break;
					case 'file':
						str += "<iframe src=\""+entry.url+"\"></iframe>"
						break;
					}
				}
				str += '</li>';
			});
			return str += '</ul>';
		};
		box.innerHTML = fs2str(fileSystem);
	};
	
	global.getLayer = function(path) {
		function unpackLayers(lobj, path) { //Returns the layer object the path is pointing at.
			if(path.length) {
				return unpackLayers(lobj[_.head(path)], _.tail(path)); //lobj = layer object, be it a window, folder, or canvas
			} else {
				return lobj;
			}
		};
		return unpackLayers(fileSystem, path);
	};
})(this)