import mongoose from "mongoose";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
const app = express();
//Schema for the database
const passwordsschema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  FullName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  Products: [
    {
      productName: { type: String },
      productTitle: { type: String },
      productDescription: { type: String },
      images: { type: [String] },
      rating: { type: Number },
      orders: { type: Number },
      ProductNumber: { type: Number },
    },
  ],
});
app.use(express.json());
app.use(cookieParser());
const passwords = mongoose.model("passwords", passwordsschema);
//Middleware to check if the user has logged in
const authenticate = (req, res, next) => {
  const cookies = req.cookies.token;
  if (cookies) {
    try {
      const decoded = jwt.verify(
        cookies.toString(),
        process.env.JWT_SECRET.toString(),
        (err, decoded) => {
          if (err) {
            console.log(err);
            throw Error("Token expired");
          }
        }
      );
      req.user = decoded;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    return res.status(401).json({ message: "Authorization required" });
  }
};

export { passwords, authenticate };
