const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * Socket.IO authentication middleware
 * - Reads httpOnly cookie
 * - Verifies JWT
 * - Attaches user to socket
 */
module.exports = async function authSocket(socket, next) {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error("Not authenticated"));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.token; // ⚠️ must match your auth cookie name

    if (!token) {
      return next(new Error("Missing auth token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select("_id email role");
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user; // 🔥 attach user
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
};
