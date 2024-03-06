import express from "express";
import path from "path";
import { passwords, salts, authenticate } from "./mongoose.js";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const app = express();
const JWT_SECRET = 'j@hjtst5%$#%&&$@&^&%#%&#^%#*&&%#(()<?<"{{}":{}:{:_+)++)+$$';
app.use(express.static(path.join(__dirname, "build")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Signup route
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});
//Login route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});
//Route if user has logged in
app.get("/authenticator", authenticate, (req, res) => {
  res.send("You are logged in");
});

app.post("/authorization", async (req, res) => {
  const DATA = req.body;
  const user = await salts.findOne({ username: DATA.Email });
  var hash = await bcrypt.hash(DATA.Password, user.salt);
  try {
    if (await passwords.findOne({ username: DATA.Email, password: hash })) {
      const token = jwt.sign({ username: DATA.Email }, JWT_SECRET, {
        expiresIn: "40m",
      });

      res.header("Authorization", `${token}`);
      res.send(DATA);
    } else {
      res.send("unauthorized");
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
app.post("/storingdata", async (req, res) => {
  const DATA = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(DATA.Password, salt);
  try {
    if (await passwords.findOne({ username: DATA.Email })) {
      throw new Error("Choose a unique username");
    } else {
      const user = new passwords({
        username: DATA.Email,
        password: hash,
      });
      const saltdata = new salts({
        username: DATA.Email,
        salt: salt,
      });
      await user.save();
      await saltdata.save();
      res.send("User registered");
    }
  } catch (error) {
    res.status(500).send("Internal Server error");
  }
});
app.listen(PORT, () => {
  console.log(`The application is running at ${PORT}`);
});
