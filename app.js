import express from "express";
import mongoose from "mongoose";
import path from "path";
import {
  passwords,
  authenticate,
  checklogin,
  authenticateAPI,
} from "./mongoose.js";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import uploadImage from "./cloudinary.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000 || process.env.PORT;
const app = express();
const options = {
  httpOnly: true,
  secure: true,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Api for getting a specific products
app.post("/:userid/:prodid", authenticateAPI, async (req, res) => {
  const { userid, prodid } = req.params;

  try {
    const user = await passwords.findById(userid);
    if (user) {
      for (let i = 0; i < user.Products.length; i++) {
        if (user.Products[i]._id == prodid) {
          return res.send(user.Products[i]);
        }
      }
    } else {
      return res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
});
//Api for getting products
app.get("/getProducts", authenticateAPI, async (req, res) => {
  try {
    const data = await passwords.find();
    const userId = [];
    const userNames = [];
    const products = [];
    const dataArr = [];
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].Products.length; j++) {
        userNames.push(data[i].userName);
        userId.push(data[i]._id);
        products.push(data[i].Products[j]);
        dataArr.push({
          userId: data[i]._id,
          products: data[i].Products[j],
          userName: data[i].userName,
        });
      }
    }
    return res.send(dataArr);
  } catch (err) {
    return res.status(500).json({ message: "Internal server Error" });
  }
});
//dynamic route for showing products
app.get("/:userid/:prodid", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Endpoint for main page
//Endpoint for adding products
app.get("/user/products", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Signup route
app.get("/register", checklogin, (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Login route
app.get("/login", checklogin, (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});
//Endpoint for authorizing user and setting cookies
app.post("/authorization", async (req, res) => {
  const DATA = req.body;
  try {
    if (await passwords.findOne({ userName: DATA.userName })) {
      const data2 = await passwords.findOne({ userName: DATA.userName });
      const compare = await bcrypt.compare(DATA.Password, data2.password);
      if (!compare) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

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
    return res.status(500).send(err);
  }
});
//This endpoint is for saving userdata
app.post("/storingData", async (req, res) => {
  const DATA = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(DATA.password, salt);
  try {
    if (await passwords.findOne({ userName: DATA.userName })) {
      return res.status(401).json({ message: "Username already exists" });
    } else {
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
      return res.status(200).json({ message: "User registered successfully" });
    }
  } catch (error) {
    return res.status(error.statusCode).json({ message: error.message });
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
    url.push(result[i].secure_url);
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
            return res.status(401).json({ message: "User not logged in" });
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
                      productCategory: req.body.productCategory,
                      productPrice: price,
                      images: url,
                      rating: 5,
                      totalCustomersRated: 1,
                      ProductNumber: data.Products.length + 1,
                    },
                  },
                }
              );
            } catch (err) {
              return res.status(500).send(err);
            }
            return res.status(200).send("Product added successfully");
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
  res.status(404).send("<h1>404 Page not found</h1>");
});
app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`The application is running at PORT ${PORT}`);
  } catch {
    process.exit(1);
  }
});
