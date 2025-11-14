// server/routes/userChallenges.js
const router = require('express').Router();
const { ObjectId } = require('mongodb');
const verifyToken = require('../middleware/verifyToken');

module.exports = (userChallengesCollection) => {

    // PATCH /api/user-challenges/:id/progress - Update User Progress (Protected)
    router.patch('/:id/progress', verifyToken, async (req, res) => {
        const { id } = req.params; // The _id of the UserChallenges document
        const { newProgress, status } = req.body;
        const userId = req.user.uid; // The user attempting to update

        // Basic validation
        if (newProgress === undefined || typeof newProgress !== 'number' || newProgress < 0 || newProgress > 100) {
            return res.status(400).json({ message: 'Invalid progress value (must be 0-100)' });
        }

        try {
            const result = await userChallengesCollection.updateOne(
                {
                    _id: new ObjectId(id),
                    userId: userId // Security: Ensure only the owner can update
                },
                {
                    $set: {
                        progress: newProgress,
                        status: status || (newProgress === 100 ? 'Finished' : 'Ongoing'), // Auto-set status
                        lastUpdate: new Date()
                    }
                }
            );

            if (result.modifiedCount === 0) {
                // If it fails, check if the document exists but the user doesn't own it
                const docExists = await userChallengesCollection.findOne({ _id: new ObjectId(id) });
                if (docExists) {
                    return res.status(403).json({ message: 'Forbidden: You cannot update this progress.' });
                }
                return res.status(404).json({ message: 'User Challenge record not found.' });
            }

            res.json({ message: 'Progress updated successfully' });
        } catch (error) {
            console.error('Error updating progress:', error);
            res.status(500).json({ message: 'Failed to update progress' });
        }
    });

    // GET /api/user-challenges/my-activities - Get all challenges for logged-in user (Protected)
    router.get('/my-activities', verifyToken, async (req, res) => {
        const userId = req.user.uid;
        try {
            const activities = await userChallengesCollection.find({ userId: userId }).toArray();
            res.json(activities);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch user activities' });
        }
    });

    return router;
};