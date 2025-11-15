// routes/userChallenges.js
const express = require('express');

module.exports = ({ userChallengesCollection, challengesCollection, ObjectId, admin }) => {
  const router = express.Router();

  // GET my challenges (needs auth)
  router.get('/my', async (req, res) => {
    try {
      const uid = req.user.uid;
      console.log('Fetching user challenges for UID:', uid);

      const userChallenges = await userChallengesCollection
        .find({ userId: uid })
        .toArray();

      console.log('Found user challenges:', userChallenges.length);
      res.json(userChallenges);
    } catch (err) {
      console.error('Error fetching user challenges:', err);
      res.status(500).json({ error: 'Failed to fetch user challenges' });
    }
  });

  // UPDATE progress
  router.patch('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { progress, status } = req.body;
      const uid = req.user.uid;

      const update = {
        $set: {
          progress,
          status: status || 'Ongoing',
          updatedAt: new Date(),
        },
      };

      const result = await userChallengesCollection.updateOne(
        { _id: new ObjectId(id), userId: uid },
        update
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Challenge not found or not yours' });
      }

      res.json({ modified: result.modifiedCount });
    } catch (err) {
      console.error('Error updating challenge:', err);
      res.status(500).json({ error: 'Failed to update' });
    }
  });

  // POST: Join a challenge
  router.post('/join', async (req, res) => {
    try {
      const { challengeId } = req.body;
      const uid = req.user.uid;

      if (!challengeId) {
        return res.status(400).json({ error: 'challengeId is required' });
      }

      // Check if challenge exists
      const challenge = await challengesCollection.findOne({
        _id: new ObjectId(challengeId),
      });
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      // Check if already joined
      const alreadyJoined = await userChallengesCollection.findOne({
        userId: uid,
        challengeId: new ObjectId(challengeId),
      });
      if (alreadyJoined) {
        return res.status(400).json({ error: 'Already joined this challenge' });
      }

      // Insert join record
      const result = await userChallengesCollection.insertOne({
        userId: uid,
        challengeId: new ObjectId(challengeId),
        progress: 0,
        status: 'Ongoing',
        joinedAt: new Date(),
        updatedAt: new Date(),
      });

      // Increment participants count
      await challengesCollection.updateOne(
        { _id: new ObjectId(challengeId) },
        { $inc: { participants: 1 } }
      );

      res.json({ message: 'Joined successfully', id: result.insertedId });
    } catch (err) {
      console.error('Error joining challenge:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET: Participants of a challenge
  router.get('/participants/:challengeId', async (req, res) => {
    try {
      const { challengeId } = req.params;

      if (!ObjectId.isValid(challengeId)) {
        return res.status(400).json({ error: 'Invalid challenge ID' });
      }

      // Get all join records
      const joins = await userChallengesCollection
        .find({ challengeId: new ObjectId(challengeId) })
        .toArray();

      if (joins.length === 0) {
        return res.json([]);
      }

      // Extract Firebase UIDs
      const uids = joins.map(j => j.userId);

      // Fetch user data from Firebase Admin SDK
      const userRecords = await admin.auth().getUsers(
        uids.map(uid => ({ uid }))
      );

      // Map user data
      const participants = joins.map(join => {
        const user = userRecords.users.find(u => u.uid === join.userId);
        return {
          _id: join._id,
          displayName: user?.displayName || 'Anonymous',
          email: user?.email || null,
          photoURL: user?.photoURL || null,
          joinedAt: join.joinedAt,
        };
      });

      res.json(participants);
    } catch (err) {
      console.error('Error fetching participants:', err);
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  });

  return router;
};