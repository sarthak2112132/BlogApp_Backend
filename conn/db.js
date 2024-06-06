const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MDATABASE_URI);
    console.log("MongoDb Database Connected");
  } catch (e) {
    console.log("Error in MongoDb Connection", e);
  }
};

module.exports = connectDb;
