// server/routes/challenges.js
const router = require('express').Router();
const { ObjectId } = require('mongodb');
const verifyToken = require('../middleware/verifyToken');

// Export a function that accepts the collection and returns the router
module.exports = (challengesCollection, userChallengesCollection) => {

    // GET /api/challenges - List (Supports Advanced Filters)
    router.get('/', async (req, res) => {
        const {
            category,
            startDate,
            endDate,
            minParticipants,
            maxParticipants,
            search
        } = req.query;

        let query = {};

        // 1. Category Filter ($in)
        if (category) {
            // Allows multiple categories (e.g., ?category=Waste Reduction,Energy Saving)
            const categories = Array.isArray(category) ? category : category.split(',');
            query.category = { $in: categories.map(c => new RegExp(`^${c.trim()}$`, 'i')) };
        }

        // 2. Date Range Filtering ($gte, $lte)
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) {
                // Find challenges that start ON or AFTER this date
                query.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                // Find challenges that start ON or BEFORE this date
                query.startDate.$lte = new Date(endDate);
            }
        }

        // 3. Participants Range Filtering ($gte, $lte)
        if (minParticipants || maxParticipants) {
            query.participants = {};
            if (minParticipants) {
                query.participants.$gte = parseInt(minParticipants);
            }
            if (maxParticipants) {
                query.participants.$lte = parseInt(maxParticipants);
            }
        }

        // Optional: Search filter for title/description
        if (search) {
             query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        try {
            const challenges = await challengesCollection.find(query).toArray();
            res.json(challenges);
        } catch (error) {
            console.error('Error fetching challenges:', error);
            res.status(500).json({ message: 'Failed to fetch challenges' });
        }
    });

    // POST /api/challenges/join/:id - Join Challenge (Protected)
    router.post('/join/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const userId = req.user.uid; // Get Firebase UID from decoded token
        const userEmail = req.user.email;

        try {
            // 1. Check if user already joined
            const existingEntry = await userChallengesCollection.findOne({
                userId: userId,
                challengeId: new ObjectId(id)
            });

            if (existingEntry) {
                return res.status(400).json({ message: 'User already joined this challenge' });
            }

            // 2. Add entry to UserChallenges Collection
            const joinResult = await userChallengesCollection.insertOne({
                userId: userId,
                userEmail: userEmail,
                challengeId: new ObjectId(id),
                status: "Ongoing",
                progress: 0, // Initial progress
                joinDate: new Date(),
                lastUpdate: new Date()
            });

            // 3. Increment participants count in the main challenges collection
            const updateResult = await challengesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { participants: 1 } }
            );

            if (updateResult.modifiedCount === 0) {
                 // Handle case where challenge might be deleted between checks
                 // Also clean up the userChallenges entry if this fails
                 await userChallengesCollection.deleteOne({ _id: joinResult.insertedId });
                 return res.status(404).json({ message: 'Challenge not found' });
            }

            res.status(201).json({ message: 'Challenge joined successfully', userChallengeId: joinResult.insertedId });
        } catch (error) {
            console.error('Error joining challenge:', error);
            res.status(500).json({ message: 'Failed to join challenge' });
        }
    });

    // POST /api/challenges - Create Challenge (Protected)
    router.post('/', verifyToken, async (req, res) => {
        const challengeData = req.body;
        // The user who created the challenge is the logged in user
        const creatorEmail = req.user.email; 

        // Add timestamps and creator info
        const newChallenge = {
            ...challengeData,
            participants: 0,
            createdBy: creatorEmail,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const result = await challengesCollection.insertOne(newChallenge);
            res.status(201).json({ message: 'Challenge created successfully', challenge: result.ops[0] });
        } catch (error) {
            console.error('Error creating challenge:', error);
            res.status(500).json({ message: 'Failed to create challenge' });
        }
    });

    // GET /api/challenges/:id - Details
    router.get('/:id', async (req, res) => { /* ... implementation ... */ });

    // PATCH /api/challenges/:id - Update (Owner/Admin - Protected)
    router.patch('/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const userEmail = req.user.email; // The user attempting to update

        try {
            const challenge = await challengesCollection.findOne({ _id: new ObjectId(id) });
            if (!challenge) {
                return res.status(404).json({ message: 'Challenge not found' });
            }

            // Security check: Only allow update if current user is the creator
            if (challenge.createdBy !== userEmail) {
                // You might add an isAdmin check here for 'admin' roles
                return res.status(403).json({ message: 'Forbidden: You do not own this challenge' });
            }

            const result = await challengesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...updateData, updatedAt: new Date() } }
            );

            if (result.modifiedCount === 0) {
                return res.status(304).json({ message: 'No changes made' });
            }

            res.json({ message: 'Challenge updated successfully' });
        } catch (error) {
            console.error('Error updating challenge:', error);
            res.status(500).json({ message: 'Failed to update challenge' });
        }
    });

    // DELETE /api/challenges/:id - Delete (Owner/Admin - Protected)
    router.delete('/:id', verifyToken, async (req, res) => { /* ... implementation with owner/admin check ... */ });

    return router;
};