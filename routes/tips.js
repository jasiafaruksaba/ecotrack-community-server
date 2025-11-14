// server/routes/tips.js (Example for Home Page requirement: Recent Tips)
const router = require('express').Router();

module.exports = (tipsCollection) => {
    // GET /api/tips - Get latest 5 tips for Home Page
    router.get('/', async (req, res) => {
        try {
            const tips = await tipsCollection.find({})
                .sort({ createdAt: -1 }) // Sort by newest first
                .limit(5)
                .project({ 
                    title: 1, 
                    authorName: 1, 
                    upvotes: 1, 
                    createdAt: 1,
                    _id: 1 
                }) // Only select required fields
                .toArray();
            res.json(tips);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch tips' });
        }
    });

    return router;
};

// server/routes/events.js (Example for Home Page requirement: Upcoming Events)


module.exports = (eventsCollection) => {
    // GET /api/events - Get 4 upcoming events for Home Page
    router.get('/', async (req, res) => {
        try {
            const events = await eventsCollection.find({ 
                date: { $gte: new Date() } // Filter for events in the future
            })
                .sort({ date: 1 }) // Sort by soonest first
                .limit(4)
                .project({
                    title: 1,
                    date: 1,
                    location: 1,
                    description: 1,
                    _id: 1
                })
                .toArray();
            res.json(events);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch events' });
        }
    });

    return router;
};