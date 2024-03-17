import express from "express";
import mongoose from "mongoose";
import path from "path";
import { passwords, authenticate } from "./mongoose.js";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import helmet from "helmet";
import cors from "cors";
import uploadImage from "./cloudinary.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000 || process.env.PORT;
const app = express();
let a = true;
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));
//Endpoint for adding products
app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Signup route
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Login route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Route if user has logged in
app.get("/authenticator", authenticate, (req, res) => {
  res.send("You are logged in ");
});
//Endpoint for authorizing user and setting cookies
app.post("/authorization", async (req, res) => {
  const DATA = req.body;
  const data2 = await passwords.findOne({ userName: DATA.userName });
  const compare = await bcrypt.compare(DATA.Password, data2.password);
  try {
    if ((await passwords.findOne({ userName: DATA.userName })) && compare) {
      const token = jwt.sign(
        { username: DATA.userName },
        process.env.JWT_SECRET,
        {
          expiresIn: "30m",
        }
      );
      res.cookie("token", token, { httpOnly: true, secure: true });
      res.redirect("Authenticator");
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
//API for checking if the user can login or not
app.get("/Check", (req, res) => {
  res.send(a);
});
//This endpoint is for saving userdata
app.post("/storingData", async (req, res) => {
  const DATA = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(DATA.password, salt);
  try {
    if (await passwords.findOne({ userName: DATA.userName })) {
      a = false;
      res.redirect("/register");
    } else {
      a = true;
      const user = new passwords({
        userName: DATA.userName,
        FullName: DATA.FullName,
        password: hash,
      });
      await user.save();
      res.send("User registered");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
});
//Storing products data
app.post("/StoringProducts", async (req, res) => {
  const DATA = req.body;
  console.log(req.files);
  res.send(req.files);
  const image = await uploadImage(DATA.product_images.tempFilePath);
  res.send(DATA.product_images);
  const cookies = req.cookies.token;
  if (cookies) {
    const product_name = DATA.product_name;
    const product_title = DATA.product_title;
    const product_description = DATA.product_description;
    const image = DATA.images;
    jwt.verify(cookies, process.env.JWT_SECRET, async (err, decode) => {
      if (err) {
        res.status(500).send("Internal server error");
        return;
      }
      const { username } = decode;
      const user = await passwords.findOne({ userName: username });
      const Product_Number = user.products.length + 1;
      if (user) {
        user.products.push({
          productName: product_name,
          productTitle: product_title,
          productDescription: product_description,
          images: image,
          ProductNumber: Product_Number,
        });
        await user.save();
        res.status(200).send("Product added");
      }
    });
  } else {
    res.send("Authorization required");
  }
});
app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log(`The application is running at ${PORT}`);
  } catch {
    process.exit(1);
  }
});
