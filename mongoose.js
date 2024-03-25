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
      productTitle: { type: String },
      productDescription: { type: String },
      productCategory: { type: String },
      productPrice: { type: Number },
      images: { type: [String] },
      rating: { type: Number },
      totalCustomersRated: { type: Number },
      savedItems: { type: [String] },
    },
  ],
});
app.use(express.json());
app.use(cookieParser());
const passwords = mongoose.model("passwords", passwordsschema);
//Middle ware to check if the user is authenticated
const authenticate = (req, res, next) => {
  const cookies = req.cookies.token;
  if (cookies) {
    try {
      const decoded = jwt.verify(
        cookies.toString(),
        process.env.JWT_SECRET.toString(),
        async (err, decoded) => {
          if (err) {
            console.log(err);
            throw Error("Token expired");
          }
          const { fullName } = decoded;
          const data = await passwords.findOne({ userName: fullName });
          if (data) {
            next();
          } else {
            res.status(401).json({ message: "Authorization required" });
          }
        }
      );
    } catch (err) {
      return res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    return res.status(401).json({ message: "Authorization required" });
  }
};
const checklogin = (req, res, next) => {
  const cookies = req.cookies.token;
  if (cookies) {
    try {
      const decoded = jwt.verify(
        cookies.toString(),
        process.env.JWT_SECRET.toString(),
        async (err, decoded) => {
          if (err) {
            console.log(err);
            throw Error("Token expired");
          }
          const { fullName } = decoded;
          const data = await passwords.findOne({ userName: fullName });
          if (data) {
            res.redirect("/");
          } else {
            next();
          }
        }
      );
    } catch (err) {
      next();
    }
  } else {
    next();
  }
};
const authenticateAPI = (token) => (req, res, next) => {
  const header = req.headers["authorization"];
  if (header === `Bearer ${token}`) {
    next();
  } else {
    return res.status(500).send("Internal server error");
  }
};

export { passwords, authenticate, checklogin, authenticateAPI };
