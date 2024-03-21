import express from "express";
import mongoose from "mongoose";
import path from "path";
import { passwords, authenticate } from "./mongoose.js";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import uploadImage from "./cloudinary.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000 || process.env.PORT;
const app = express();
let a = true;
const options = {
  httpOnly: true,
  secure: true,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};
const clearCookie = (res, cookieName) => {
  res.cookie(cookieName, "", { expires: new Date(0) });
};

app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Endpoint for adding products
app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Signup route
app.get("/register", (req, res) => {
  res.cookie("check", a, { expires: 0 });
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
        { fullName: DATA.userName },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      res.cookie("token", token, options);
      res.redirect("Authenticator");
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    res.status(500).send(err);
  }
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
      clearCookie(res, "check");
      const user = new passwords({
        userName: DATA.userName,
        FullName: DATA.FullName,
        password: hash,
      });
      await user.save();
      const token = jwt.sign(
        { fullName: DATA.userName },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      res.cookie("token", token, options);
      res.redirect("Authenticator");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
});
//Storing products data
app.post("/storingProducts", upload.array("productImage"), async (req, res) => {
  const result = [];
  const Files = [];
  Files.push(req.files.map((file) => file.path));
  for (let i = 0; i < Files[0].length; i++) {
    result.push(await uploadImage(Files[0][i]));
  }
  const url = [];
  for (let i = 0; i < result.length; i++) {
    url.push(result[i].url);
  }
  const price = parseFloat(req.body.productPrice);
  const cookies = req.cookies.token;

  if (cookies) {
    try {
      jwt.verify(
        cookies.toString(),
        process.env.JWT_SECRET.toString(),
        async (err, decoded) => {
          if (err) {
            throw Error("User not logged in");
          }
          const { fullName } = decoded;
          const data = await passwords.findOne({ userName: fullName });
          if (data) {
            try {
              await passwords.updateOne(
                { userName: fullName },
                {
                  $push: {
                    Products: {
                      productTitle: req.body.productTitle,
                      productDescription: req.body.productDescription,
                      productPrice: price,
                      images: url,
                      ProductNumber: data.Products.length + 1,
                    },
                  },
                }
              );
            } catch (err) {
              res.status(500).send(err);
            }
            res.status(200).send("Product added successfully");
          } else {
            return res.status(401).json({ message: "Authorization required" });
          }
        }
      );
    } catch (err) {
      return res.status(401).json({ message: err });
    }
  } else {
    return res.status(401).json({ message: "Authorization required" });
  }
});
app.use((req, res, next) => {
  res.status(404).send("<h1>Page not found</h1>");
});
app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`The application is running at PORT ${PORT}`);
  } catch {
    process.exit(1);
  }
});
