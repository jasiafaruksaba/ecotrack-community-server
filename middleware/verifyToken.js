// server/middleware/verifyToken.js
const admin = require('firebase-admin');

// Service Account setup (Replace with your actual path or process.env variable)
// You need to store the service account JSON data in your .env or similar
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin SDK failed to initialize:", error);
  }
}

const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Token is what the client gets from currentUser.getIdToken()
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    // Verify the token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach the decoded token info (user email, uid) to the request object
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    // Most common error is 'Firebase ID token has expired.'
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = verifyToken;