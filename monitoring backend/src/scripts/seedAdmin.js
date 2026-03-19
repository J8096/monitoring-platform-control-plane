const path    = require("path");
const mongoose = require("mongoose");
const dotenv   = require("dotenv");
const User     = require("../models/User");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || "admin@sentinel.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: ADMIN_EMAIL });
  if (exists) {
    console.log("✅ Admin already exists:", ADMIN_EMAIL);
    process.exit(0);
  }

  await User.create({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "ADMIN" });

  console.log("✅ Admin created:", ADMIN_EMAIL);
  console.log("   Password:", ADMIN_PASSWORD);
  console.log("   Change this password immediately after first login.");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
