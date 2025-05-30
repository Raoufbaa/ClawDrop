// File: server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const { ExpressPeerServer } = require('peer');
const http = require('http');

const app = express();

// 1) Serve everything under /public as static files
//    So test.html will be reachable at: GET /test.html
app.use(express.static(path.join(__dirname, 'public')));

// 2) Determine the port: use PEERJS_PORT locally, or Render’s assigned $PORT
const PORT = process.env.PEERJS_PORT || process.env.PORT || 28175;

// 3) Create an HTTP server from Express
const server = http.createServer(app);

// 4) Mount PeerJS’s Express middleware at the path /ClawDrop
const peerServer = ExpressPeerServer(server, {
  path: process.env.PEERJS_PATH || '/ClawDrop',
  debug: true,
  allow_discovery: false,
  // (You can also pass iceServers here if you want, but since your ICE is client-side, it’s ok.)
});

// 5) Tell Express to use the PeerJS server at that path
app.use(process.env.PEERJS_PATH || '/ClawDrop', peerServer);

// 6) Start listening
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`   • Static files (test.html) served from /public`);
  console.log(`   • PeerJS server mounted at ${process.env.PEERJS_PATH || '/ClawDrop'}`);
});
