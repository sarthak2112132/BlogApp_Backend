const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const connectDb = require("./conn/db");

const authRoutes = require("./routes/authRoute");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // Allow credentials (cookies) to be sent
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/uploads", express.static(__dirname + "/uploads"));

app.use("/api/auth", authRoutes);

connectDb();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
