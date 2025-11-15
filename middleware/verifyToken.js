module.exports = (admin) => {
  return async (req,res,next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if(!token) return res.status(401).json({message:'No token'});
    try{
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    }catch(err){
      console.error('Token verify failed', err);
      res.status(401).json({message:'Invalid token'});
    }
  };
};
