// File: relay-server.js
const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Map “code” → array of WebSocket clients
const channels = {};

wss.on('connection', (ws) => {
  let joinedCode = null;

  ws.on('message', (msg) => {
    try {
      const { code, payload } = JSON.parse(msg);
      if (!joinedCode) {
        // First message: join this code’s channel
        joinedCode = code;
        if (!channels[code]) channels[code] = [];
        channels[code].push(ws);
        return;
      }
      // Broadcast “payload” to all other clients in the same channel
      channels[code].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ payload }));
        }
      });
    } catch (e) {
      console.error('Invalid message format', e);
    }
  });

  ws.on('close', () => {
    if (joinedCode && channels[joinedCode]) {
      channels[joinedCode] = channels[joinedCode].filter(c => c !== ws);
      if (channels[joinedCode].length === 0) {
        delete channels[joinedCode];
      }
    }
  });
});

const PORT = process.env.PORT || 28175;
server.listen(PORT, () => {
  console.log(`Relay server listening on port ${PORT}`);
});
