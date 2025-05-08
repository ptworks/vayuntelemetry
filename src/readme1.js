const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const WebSocket = require('ws');
const https = require('https');
const { Server } = require('socket.io');

const app = express();
const HTTP_PORT = 8000;   // for Express REST APIs
const WS_PORT = 8080;     // for Telemetry WebSocket
const SSL_KEY = './ssl/key.pem';
const SSL_CERT = './ssl/cert.pem';

// Create HTTPS Server for Express + Socket.io
const httpsServer = https.createServer({
  key: fs.readFileSync(SSL_KEY),
  cert: fs.readFileSync(SSL_CERT),
}, app);

// Create WebSocket Server for Telemetry
const telemetryWSS = new WebSocket.Server({ port: WS_PORT });

// Create Socket.IO server (for Video stream and Emergency events)
const io = new Server(httpsServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));

// In-memory storage
let latestTelemetry = {};
let lastEmergencyLocation = null;

//
// --- TELEMETRY SECTION (handled by WebSocket) ---
//

telemetryWSS.on('connection', (ws) => {
  console.log('Telemetry WebSocket client connected.');
});

// POST telemetry from drone (Python side will send this)
app.post('/telemetry', (req, res) => {
  const telemetry = req.body;
  latestTelemetry = telemetry;

  telemetryWSS.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(telemetry));
    }
  });

  res.sendStatus(200);
});

// GET latest telemetry (optional API)
app.get('/telemetry', (req, res) => {
  res.json(latestTelemetry);
});

//
// --- EMERGENCY SECTION (triggered from React Native) ---
//

app.post('/emergency', (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Missing coordinates" });
  }

  lastEmergencyLocation = { latitude, longitude };
  console.log("Emergency button pressed:", lastEmergencyLocation);

  // Emit to all Socket.IO clients (React web clients)
  io.emit('emergency', lastEmergencyLocation);

  res.status(200).json({ message: 'Emergency received' });
});

//
// --- VIDEO STREAM SECTION (handled by Socket.IO) ---
//

// Pi will send video frames to here
app.post('/drone3video', (req, res) => {
  console.log('Received video frame...');
  io.emit('video', req.body); // Emit binary image to all Socket.IO clients
  res.sendStatus(200);
});

//
// --- START SERVERS ---
//

// Start Express HTTPS server (for API + Socket.IO)
httpsServer.listen(HTTP_PORT, () => {
  console.log(`HTTPS Express server running at https://100.89.116.48:${HTTP_PORT}`);
});

// Start plain WebSocket server separately (for Telemetry)
console.log(`Telemetry WebSocket server running at ws://100.89.116.48:${WS_PORT}`);
