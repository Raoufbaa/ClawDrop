// File: server.js
require('dotenv').config();

const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory map from “code” → array of WebSocket clients
const channels = {};

// When a new client connects via WebSocket:
wss.on('connection', (ws) => {
  let joinedCode = null;

  ws.on('message', (rawMsg) => {
    try {
      const { code, payload } = JSON.parse(rawMsg);

      // First message from a client must contain “code” only:
      if (!joinedCode) {
        joinedCode = code;
        if (!channels[code]) {
          channels[code] = [];
        }
        channels[code].push(ws);
        console.log(`[WS] Client joined channel: ${code}`);
        return;
      }

      // Subsequent messages contain { payload }:
      // Broadcast the payload to all other clients in the same channel
      if (joinedCode in channels) {
        channels[joinedCode].forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ payload }));
          }
        });
      }
    } catch (e) {
      console.error('[WS] Received invalid message:', rawMsg, e);
    }
  });

  ws.on('close', () => {
    // Remove this socket from its channel’s array
    if (joinedCode && channels[joinedCode]) {
      channels[joinedCode] = channels[joinedCode].filter(c => c !== ws);
      if (channels[joinedCode].length === 0) {
        delete channels[joinedCode];
      }
      console.log(`[WS] Client left channel: ${joinedCode}`);
    }
  });
});

// Determine port: use PEERJS_PORT (if defined) or Render’s PORT or fallback 28175
const PORT = process.env.PEERJS_PORT || process.env.PORT || 28175;

// (Optional) Serve a simple status page at “/” so you can see the server is live:
app.get('/', (req, res) => {
  res.send('WebSocket Relay Server is running.');
});

// Start the HTTP+WebSocket server:
server.listen(PORT, () => {
  console.log(`🚀 Relay server listening on port ${PORT}`);
});
