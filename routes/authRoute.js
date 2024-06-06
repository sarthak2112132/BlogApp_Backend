const express = require("express");
const multer = require("multer");
const uploads = multer({ dest: "uploads/" });
const {
  registerController,
  loginController,
  profileController,
  logoutController,
  postController,
  getPostController,
  updatePostController,
  getSinglePostController,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/profile", profileController);
router.post("/post", uploads.single("file"), postController);
router.put("/post", uploads.single("file"), updatePostController);
router.get("/getpost", getPostController);
router.get("/post/:id", getSinglePostController);

module.exports = router;
