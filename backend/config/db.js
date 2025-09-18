// backend/config/db.js
const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://sv894871_db_user:l2kGcVJFMRsp6vEJ@cluster0.cd4fsai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// console.log("🔍 db.js loaded...");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
