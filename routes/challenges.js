const express = require('express');

module.exports = ({ challengesCollection, userChallengesCollection, ObjectId }) => {
  const router = express.Router();

  // GET all challenges
  router.get('/', async (req, res) => {
    try {
      console.log('Fetching from collection:', challengesCollection.collectionName);
      const challenges = await challengesCollection.find({}).toArray();
      console.log('Found challenges:', challenges.length);
      res.json(challenges);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      res.status(500).json({ error: 'Failed to fetch challenges' });
    }
  });

  // GET single challenge by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid challenge ID' });
      }

      const challenge = await challengesCollection.findOne({ _id: new ObjectId(id) });

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      res.json(challenge);
    } catch (err) {
      console.error('Error fetching challenge by ID:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};