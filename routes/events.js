// routes/events.js
const express = require('express');

module.exports = ({ eventsCollection }) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      console.log('Fetching events from:', eventsCollection.collectionName);
      const limit = Number(req.query.limit) || 20;
      const events = await eventsCollection.find({}).sort({ date: 1 }).limit(limit).toArray();
      console.log('Found events:', events.length);
      res.json(events);
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const data = req.body;
      data.createdAt = new Date();
      const result = await eventsCollection.insertOne(data);
      res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
      console.error('Error creating event:', err);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  return router;
};