const Turn = require('node-turn');

const server = new Turn({
  // STUN
  listeningPort: 3478,
  listeningIP: '0.0.0.0',

  // TURN
  relayIP: '0.0.0.0', // Should be your server's public IP in production
  relayIPs: [],

  // Authentication
  authMech: 'long-term',
  credentials: {
    webrtc: 'webrtc123',
    mobile: 'mobile123',
    test: 'test123',
  },

  // Realm
  realm: 'webrtc-realm',

  // Logging
  debugLevel: 'INFO',
});

server.start();

console.log('🔄 TURN Server started on port 3478');
console.log('📱 Credentials for mobile testing:');
console.log('   Username: webrtc, Password: webrtc123');
console.log('   Username: mobile, Password: mobile123');
