// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase
const serviceAccount = require("./ecotrack-community-firebase-admin-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// MongoDB
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing in .env file");
  process.exit(1);
}

const client = new MongoClient(uri);

async function start() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db('EcoTrackDB');;
    const challengesCollection = db.collection('challenges');
    const tipsCollection = db.collection('tips');
    const eventsCollection = db.collection('events');
    const userChallengesCollection = db.collection('userChallenges');

    const verifyToken = require('./middleware/verifyToken')(admin);

    const challengesRouter = require('./routes/challenges')({ challengesCollection, userChallengesCollection, ObjectId });
    const tipsRouter = require('./routes/tips')({ tipsCollection });
    const eventsRouter = require('./routes/events')({ eventsCollection });
    const userChallengesRouter = require('./routes/userChallenges')({ userChallengesCollection, challengesCollection, ObjectId });

    app.use('/api/challenges', challengesRouter);
    app.use('/api/tips', tipsRouter);
    app.use('/api/events', eventsRouter);
    app.use('/api/userChallenges', verifyToken, userChallengesRouter);

    app.get('/api/health', (req, res) => res.json({ ok: true }));

    app.get('/', (req, res) => {
      res.send('<h1>EcoTrack Community API</h1><p>Go to <a href="/api/challenges">/api/challenges</a></p>');
    });

    app.use((req, res) => {
      res.status(404).send('<h1>404 - Not Found</h1>');
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();