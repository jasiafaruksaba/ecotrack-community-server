// routes/tips.js
const express = require('express');

module.exports = ({ tipsCollection }) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      console.log('Fetching tips from:', tipsCollection.collectionName);
      const limit = Number(req.query.limit) || 20;
      const tips = await tipsCollection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
      console.log('Found tips:', tips.length);
      res.json(tips);
    } catch (err) {
      console.error('Error fetching tips:', err);
      res.status(500).json({ error: 'Failed to fetch tips' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const data = req.body;
      data.createdAt = new Date();
      data.upvotes = data.upvotes || 0;
      const result = await tipsCollection.insertOne(data);
      res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
      console.error('Error creating tip:', err);
      res.status(500).json({ error: 'Failed to create tip' });
    }
  });

  return router;
};