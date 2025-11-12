const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();



const app = express();
const port = process.env.PORT || 3000;


// middleware
app.use(cors());
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

      // Get all challenges
    app.get('/api/challenges', async (req, res) => {
      const result = await challengesCollection.find().toArray();
      res.send(result);
    });

    // Get single challenge
    app.get("/api/challenges/:id", async (req, res) => {
      const id = req.params.id;
      const result = await challengesCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

       // Add new challenge
    app.post("/api/challenges", async (req, res) => {
      const challenge = req.body;
      const result = await challengesCollection.insertOne(challenge);
      res.send(result);
    });

    // Update challenge
    app.patch("/api/challenges/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const result = await challengesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );
      res.send(result);
    });

    // Delete challenge
    app.delete("/api/challenges/:id", async (req, res) => {
      const id = req.params.id;
      const result = await challengesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Tips
    app.get("/api/tips", async (req, res) => {
      const result = await tipsCollection.find().sort({ createdAt: -1 }).limit(5).toArray();
      res.send(result);
    });

    // Events
    app.get("/api/events", async (req, res) => {
      const result = await eventsCollection.find().sort({ date: 1 }).limit(4).toArray();
      res.send(result);
    });

    // Join Challenge
    app.post("/api/challenges/join/:id", async (req, res) => {
      const { userId } = req.body;
      const challengeId = req.params.id;

      await userChallengesCollection.insertOne({
        userId,
        challengeId,
        status: "Not Started",
        progress: 0,
        joinDate: new Date(),
      });

      await challengesCollection.updateOne(
        { _id: new ObjectId(challengeId) },
        { $inc: { participants: 1 } }
      );

      res.send({ success: true });
    });

  } catch (error) {
    console.error(" Database connection failed:", error);
  }
}


app.listen(port, () =>{
    console.log(`Ecotrack community server is running on port: ${port}`)
})