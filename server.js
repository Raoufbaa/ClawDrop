// server.js
require('dotenv').config();
const { PeerServer } = require('peer');

const port = process.env.PEERJS_PORT;
const path = process.env.PEERJS_PATH;

PeerServer({
  port,
  path,
  debug: true,
  allow_discovery: false,
});

console.log(`🚀 PeerJS server listening at ${path} on port ${port}`);
