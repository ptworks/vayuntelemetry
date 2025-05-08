const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const fs = require('fs');
const app = express();
const PORT = 8000;
const WS_PORT = 8080;
const WS_PORTV =  8081;
const https = require('https');

const server =  new WebSocket.Server({ port: WS_PORTV });

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
// In-memory storage
let latestTelemetry = {};
let clients = [];
// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', ws => {
  console.log('WebSocket client connected.');
});

const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',   // Allow React app to connect
        methods: ['GET', 'POST']
      }
    });
    
    // WebSocket connection
    io.on('connection', (socket) => {
      console.log('New WebSocket client connected:', socket.id);
    
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    // WebSocket: on connection
    //wss.on('connection', (ws) => {
      //console.log('New WebSocket connection');
      //clients.push(ws);  // Add new client to the array
    
      // Handle WebSocket disconnection
      //ws.on('close', () => {
       // clients = clients.filter(client => client !== ws);  // Remove disconnected client
      //});
    //});
    // Receive telemetry from Python
app.post('/telemetry', (req, res) => {
    const telemetry = req.body;
  //  console.log('Received telemetry:', telemetry);
  
    // Save the latest telemetry
    latestTelemetry = telemetry;
  
    // Broadcast to all WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(telemetry));
      }
    });
  
    res.sendStatus(200);
  });
  
  // Optional REST endpoint
  app.get('/telemetry', (req, res) => {
    res.json(latestTelemetry);
  });

  let lastEmergencyLocation = null;

app.post('/emergency', (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Missing coordinates" });
  }

  lastEmergencyLocation = { latitude, longitude };
  console.log("Emergency button pressed:", lastEmergencyLocation);

  // Broadcast to all connected WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: "emergency",
        payload: lastEmergencyLocation
      }));
    }
  });

  res.status(200).json({ message: 'Emergency received' });
});

// Endpoint for Pi to send video frames
app.post('/video', (req, res) => {
    const frameData = req.body; // raw JPEG bytes
    console.log(frameData);
    // Broadcast to all WebSocket clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(frameData);
      }
    });
  
    res.sendStatus(200);
  });

  // API endpoint to receive video frame from Pi
app.post('/dronevideo1', (req, res) => {
    let data = [];
  
    req.on('data', chunk => {
      data.push(chunk);
    });
  
    req.on('end', () => {
      const frame = Buffer.concat(data); // Frame is here (JPEG data)
  
      // Broadcast the frame to all connected clients
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(frame);
        }
      }
  
      res.status(200).send('Frame received and broadcasted');
    });
  });

  // Route to handle incoming video frame from Pi
app.post('/dronevideo', (req, res) => {
    console.log('Received video frame...');
  
    let data = [];
  
    req.on('data', (chunk) => {
      console.log('Received chunk of data...');
      data.push(chunk);  // Collect chunks of data
    });
    console.log(data);
    req.on('end', () => {
      console.log('Finished receiving data. Sending frame to WebSocket clients...');
  
      const frame = Buffer.concat(data);  // Combine all data chunks
  
      // Send the frame to all connected WebSocket clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(frame);
        }
      });
  
      console.log('Frame broadcasted to clients.');
  
      // Respond quickly to avoid timeout
      res.status(200).send('Frame received and broadcasted');
    });
  
    req.on('error', (err) => {
      console.error('Error receiving video:', err);
      res.status(500).send('Error receiving video');
    });
  });
  
  app.post('/drone1video', (req, res) => {
    console.log('Received video frame of size:', req.body.length);
  
    fs.writeFile('received_frame.jpg', req.body, (err) => {
      if (err) {
        console.error('Error saving frame:', err);
        res.status(500).send('Error saving frame');
      } else {
        console.log('Frame saved.');
        res.status(200).send('Frame received');   // <- you must send a response!
      }
    });
  });
  app.post('/drone2video', (req, res) => {
    console.log('Received video frame of size:', req.body.length);
  
    // Broadcast the frame to all connected WebSocket clients
    for (const client of clients) {
      client.emit('video_frame', req.body.toString('base64')); // send as base64
    }
  
    res.status(200).send('Frame streamed');
  });
  
  // API to receive video frames from Pi
  app.post('/drone3video', (req, res) => {
    console.log('Received video frame...');
    io.emit('video', req.body); // Emit video frame to all clients
    res.sendStatus(200);
  });
  
  app.listen(PORT, () => {
    console.log(`HTTP server running at http://100.89.116.48:${PORT}`);
  });
  