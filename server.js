// server.js
require('dotenv').config();
const { PeerServer } = require('peer');

// Locally: PEERJS_PORT, PEERJS_PATH
// On Render: use process.env.PORT, fall back to defaults below
const port = process.env.PEERJS_PORT || process.env.PORT || 28175;
const path = process.env.PEERJS_PATH || '/ClawDrop';

if (!port) {
  console.error(
    '❌ No port configured. Set PEERJS_PORT in .env or rely on $PORT.',
  );
  process.exit(1);
}

PeerServer({
  port,
  path,
  debug: true,
  allow_discovery: false,
});

console.log(`🚀 PeerJS server listening at ${path} on port ${port}`);
