const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
   try {
    const token = req.header("Authorization")?.split(" ")[1];
    if(!token){
        return res.status(401).json({ message : "No token found. Please login" })
    }
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    
    req.user = decoded;
    next();
   } catch (error) {
     res.status(401).json({ message : `Invalid token due : ${error.message}` })
   }
}

module.exports = auth;