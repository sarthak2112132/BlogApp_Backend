const User = require("../models/userModel");
const Post = require("../models/postModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { log } = require("console");

const registerController = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(404).send({ msg: "Enter Credentials" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(404).send({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, password: hashedPassword });

    await user.save();
    return res.status(201).send({ msg: "User registered Successfully", user });
  } catch (error) {
    console.log("Error in RegisterController", error.message);
    return res.status(404).send({ msg: "Internal Server Error" });
  }
};

const loginController = async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(404).send({ msg: "Enter Credentials", success: false });
    }

    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res.status(404).send({ msg: "User not registered" });
    }

    const isUser = await bcrypt.compare(password, existingUser.password);

    if (!isUser) {
      return res.status(404).send({ msg: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { username, id: existingUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res
      .status(201)
      .send({ success: true, msg: "Login Successfully", existingUser, token });
  } catch (error) {
    console.log("Error in RegisterController", error.message);
    return res.status(404).send({ msg: "Internal Server Error" });
  }
};

const profileController = async (req, res) => {
  try {
    const { token } = req.cookies;

    if (token) {
      const info = jwt.verify(token, process.env.JWT_SECRET_KEY);
      res.status(201).json(info);
    }
  } catch (error) {
    console.log("Error in profileController", error.message);
    return res.status(404).send({ msg: "Internal Server Error" });
  }
};

const logoutController = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      sameSite: "None",
      expires: new Date(0), // Immediately expire the cookie
    });
    return res.status(201).json({
      success: true,
      msg: "Logout Succesfully",
    });
  } catch (error) {
    console.log("Error in logoutController", error.message);
    return res.status(404).send({ msg: "Internal Server Error" });
  }
};

const postController = async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: "Token must be provided" });
  }
  const { title, summary, content } = req.body;

  const info = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if (!info) {
    return res.status(403).json({ error: "Invalid token" });
  }
  const postDoc = await Post.create({
    title,
    summary,
    content,
    cover: newPath,
    author: info.id,
  });

  res.json({ postDoc, success: "true" });
};

const getPostController = async (req, res) => {
  const posts = await Post.find({})
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts);
};

const getSinglePostController = async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
};

const updatePostController = async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json("you are not the author");
    }
    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
  });
};

module.exports = {
  registerController,
  loginController,
  profileController,
  logoutController,
  postController,
  getPostController,
  getSinglePostController,
  updatePostController,
};
