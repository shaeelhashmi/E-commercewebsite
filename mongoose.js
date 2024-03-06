import mongoose from "mongoose";
await mongoose.connect("mongodb://127.0.0.1:27017/Authenticationsystem");
import jwt from "jsonwebtoken";
//Schema for the database
const passwordsschema = new mongoose.Schema({
  username: String,
  password: String,
  //This schema is for when we want to use the application
  // Products:[{
  //   Producttitle:String,
  //   Productdescription:String,
  //   images:Buffer
  //  }]
});
const SALT = new mongoose.Schema({
  username: String,
  salt: String,
});
const passwords = mongoose.model("passwords", passwordsschema);
const salts = mongoose.model("Salts", SALT);
//Middleware to check if the user has logged in
const authenticate = (req, res, next) => {
  const token = res.getHeaders();
  if (token) {
    try {
      const decoded = jwt.verify(token.split(" ")[1], secretKey);
      req.user = decoded;
      next();
      return;
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    res.send(token);
  }
};
export { passwords, salts, authenticate };
