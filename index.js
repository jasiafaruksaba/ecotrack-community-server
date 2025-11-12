const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;


// middleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://ecotrackdbUser:SBOZrfR4CLqf9UmR@cluster0.byjw6cl.mongodb.net/?appName=Cluster0";


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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
  
  }
}
run().catch(console.dir);

app.listen(port, () =>{
    console.log(`Ecotrack community server is running on port: ${port}`)
})