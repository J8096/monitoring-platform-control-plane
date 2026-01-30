const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// ✅ Load .env correctly (VERY IMPORTANT)
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: "admin@system.com" });
  if (exists) {
    console.log("✅ Admin already exists");
    process.exit(0);
  }

  await User.create({
    email: "admin@system.com",
    password: "admin123",
    role: "ADMIN",
  });

  console.log("✅ Admin created:");
  console.log("   email: admin@system.com");
  console.log("   password: admin123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed", err);
  process.exit(1);
});
