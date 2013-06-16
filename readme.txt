Interactive File Lister is a web app that lets the user browse part of the server file system. It is a little faster than the standard one-HTML-page-per-folder app that Nginx or Apache ship with, and it caches results so the second view of a directory is instantaneous. IFL also lets the user preview files inline, without leaving the app. An example screenshot is located at https://raw.github.com/DDR0/Better-File-Lister/master/screenshot.jpeg.

Instructions, linux, server-side:
First, install Nginx and Node.js. (I have v1.4.1 and v0.6.19, respectively.)

Move "server/file lister.node.js" to whatever directory you want to run it from. Where, doesn't matter. In that directory, run "npm install socket.io", which is the only dependancy. (Currently at v0.9.0.) You can now launch the server by running "nodejs file\ listener.node.js". By default, it will index the files in /var/www/, and listen for incoming connections on port 8080. Both are configurable in the first few lines of the script.

Next, configure Nginx to proxy anything coming to /socket.io/ to the Node.js server, including websocket connections. I have included a simple sample configuration (server/default) for Nginx which assumes that you want to serve files from /var/www. Now would be a good time to move the file and folder from client/ there, too. Run "service nginx reload".

This software is, unsurprisingly, provided without any warranty. It is released under either the GNU GPL v3.0 licence or a CC-BY-SA licence.

Instructions, client-side:
Click the + button to expand directories and preview files. Click the file name to go there. You will require a reasonably modern browser to run the app.
