require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  path: '/ws', // WebSocket endpoint
});

// Enhanced channel management
const channels = {};
const clientInfo = new Map(); // Track client information

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientId = generateId();
  ws.clientId = clientId;

  console.log(`[WS] New client connected: ${clientId}`);

  let joinedCode = null;

  ws.on('message', (rawMsg) => {
    try {
      const message = JSON.parse(rawMsg);

      switch (message.type) {
        case 'join':
          handleJoin(ws, message);
          break;
        case 'signal':
          handleSignal(ws, message);
          break;
        case 'turn-credentials':
          handleTurnCredentials(ws, message);
          break;
        default:
          // Legacy support for your existing format
          const { code, payload } = message;
          if (!joinedCode && code) {
            joinedCode = code;
            joinChannel(ws, code);
          } else if (payload) {
            broadcastToChannel(joinedCode, payload, ws);
          }
      }
    } catch (e) {
      console.error('[WS] Invalid message:', rawMsg, e);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        })
      );
    }
  });

  function handleJoin(ws, message) {
    const { code } = message;
    joinedCode = code;
    joinChannel(ws, code);

    // Send TURN server info
    ws.send(
      JSON.stringify({
        type: 'turn-info',
        turnServers: getTurnServerConfig(),
      })
    );
  }

  function handleSignal(ws, message) {
    const { targetId, signal } = message;
    if (joinedCode && channels[joinedCode]) {
      const targetClient = channels[joinedCode].find(
        (client) => client.clientId === targetId || client === ws
      );

      if (targetClient && targetClient !== ws) {
        targetClient.send(
          JSON.stringify({
            type: 'signal',
            fromId: ws.clientId,
            signal: signal,
          })
        );
      }
    }
  }

  function handleTurnCredentials(ws, message) {
    // Generate temporary TURN credentials
    const credentials = generateTurnCredentials();
    ws.send(
      JSON.stringify({
        type: 'turn-credentials',
        credentials: credentials,
      })
    );
  }

  function joinChannel(ws, code) {
    if (!channels[code]) {
      channels[code] = [];
    }
    channels[code].push(ws);

    // Notify others in channel about new peer
    channels[code].forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'peer-joined',
            peerId: ws.clientId,
          })
        );
      }
    });

    console.log(`[WS] Client ${ws.clientId} joined channel: ${code}`);
  }

  function broadcastToChannel(code, payload, sender) {
    if (code && channels[code]) {
      channels[code].forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ payload }));
        }
      });
    }
  }

  ws.on('close', () => {
    if (joinedCode && channels[joinedCode]) {
      channels[joinedCode] = channels[joinedCode].filter((c) => c !== ws);

      // Notify others about peer leaving
      channels[joinedCode].forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: 'peer-left',
              peerId: ws.clientId,
            })
          );
        }
      });

      if (channels[joinedCode].length === 0) {
        delete channels[joinedCode];
      }
      console.log(`[WS] Client ${ws.clientId} left channel: ${joinedCode}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`[WS] Client ${ws.clientId} error:`, error);
  });
});

// Helper functions
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getTurnServerConfig() {
  const serverIP = process.env.SERVER_IP || 'your-server-ip.com';
  return [
    {
      urls: [`turn:${serverIP}:3478`],
      username: 'webrtc',
      credential: 'webrtc123',
    },
    {
      urls: [`turn:${serverIP}:3478`],
      username: 'mobile',
      credential: 'mobile123',
    },
  ];
}

function generateTurnCredentials() {
  const username = `temp_${Date.now()}`;
  const credential = Math.random().toString(36).substr(2, 15);
  return {
    username,
    credential,
    ttl: 3600, // 1 hour
  };
}

// REST API endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'WebRTC Signaling Server Active',
    channels: Object.keys(channels).length,
    connections: Array.from(channels).reduce((total, [_, clients]) => total + clients.length, 0),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PEERJS_PORT || process.env.PORT || 28175;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced WebRTC Signaling Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`🌐 HTTP endpoint: http://localhost:${PORT}`);
});
