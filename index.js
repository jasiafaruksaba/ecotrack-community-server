const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// Import API Routes
const challengesRouter = require('./routes/challenges');
const tipsRouter = require('./routes/tips');
const eventsRouter = require('./routes/events');
const userChallengesRouter = require('./routes/userChallenges');

const app = express();
const port = process.env.PORT || 3000;


// Middleware
const allowedOrigins = [
  'http://localhost:5173', // Your client development URL
  process.env.CLIENT_LIVE_URL // e.g., Netlify/Surge URL for client
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json())

const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) =>{
    res.send('Ecotract community server is running')
})

async function run() {
  try {
    await client.connect();

 const db = client.db("EcoTrackDB");
    const challengesCollection = db.collection("challenges");
    const tipsCollection = db.collection("tips");
    const eventsCollection = db.collection("events");
    const userChallengesCollection = db.collection("userChallenges");

    console.log(" MongoDB Connected Successfully!");

    // Pass collections to routers
    app.use('/api/challenges', challengesRouter(challengesCollection, userChallengesCollection));
    app.use('/api/tips', tipsRouter(tipsCollection));
    app.use('/api/events', eventsRouter(eventsCollection));
    app.use('/api/user-challenges', userChallengesRouter(userChallengesCollection));

   // Base route
    app.get('/', (req, res) => {
      res.send('EcoTrack Server is running!');
    });

    // 404 Handler (Must be the last route)
    app.use((req, res) => {
        res.status(404).json({ message: '404: API endpoint not found' });
    });

    app.listen(port, () => {
      console.log(`EcoTrack Server running on port ${port}`);
    });

  } catch (e) {
    console.error(e);
  }
}
run().catch(console.dir);


app.listen(port, () =>{
    console.log(`Ecotrack community server is running on port: ${port}`)
})