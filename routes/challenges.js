import express from "express";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET all challenges (with optional filters)
router.get("/", async (req, res) => {
  const { category, startDate, endDate, minParticipants, maxParticipants } = req.query;
  const filter = {};

  if (category) filter.category = { $in: category.split(",") };
  if (startDate || endDate) filter.startDate = {};
  if (startDate) filter.startDate.$gte = new Date(startDate);
  if (endDate) filter.startDate.$lte = new Date(endDate);
  if (minParticipants || maxParticipants) filter.participants = {};
  if (minParticipants) filter.participants.$gte = parseInt(minParticipants);
  if (maxParticipants) filter.participants.$lte = parseInt(maxParticipants);

  const challenges = await req.app.locals.db
    .collection("challenges")
    .find(filter)
    .toArray();
  res.json(challenges);
});

// GET single challenge
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const challenge = await req.app.locals.db
    .collection("challenges")
    .findOne({ _id: new ObjectId(id) });
  if (!challenge) return res.status(404).json({ message: "Challenge not found" });
  res.json(challenge);
});

// POST create new challenge (protected)
router.post("/", verifyToken, async (req, res) => {
  const data = req.body;
  data.participants = 0;
  data.createdAt = new Date();
  const result = await req.app.locals.db.collection("challenges").insertOne(data);
  res.json(result.ops[0]);
});

// PATCH update challenge (protected, owner only)
router.patch("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const update = req.body;
  const result = await req.app.locals.db.collection("challenges").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
  res.json({ modifiedCount: result.modifiedCount });
});

// DELETE challenge (protected, owner only)
router.delete("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await req.app.locals.db.collection("challenges").deleteOne({ _id: new ObjectId(id) });
  res.json({ deletedCount: result.deletedCount });
});

// POST join challenge (protected)
router.post("/join/:id", verifyToken, async (req, res) => {
  const userId = req.user.uid; // decoded from verifyToken
  const challengeId = req.params.id;

  // Check if user already joined
  const existing = await req.app.locals.db.collection("userChallenges").findOne({ userId, challengeId });
  if (existing) return res.status(400).json({ message: "Already joined" });

  // Add to userChallenges
  await req.app.locals.db.collection("userChallenges").insertOne({
    userId,
    challengeId,
    progress: 0,
    status: "Not Started",
    joinDate: new Date()
  });

  // Increment participants in challenge
  await req.app.locals.db.collection("challenges").updateOne(
    { _id: new ObjectId(challengeId) },
    { $inc: { participants: 1 } }
  );

  res.json({ message: "Joined successfully" });
});

export default router;
