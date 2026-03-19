const cookie = require("cookie");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

/**
 * Socket.IO authentication middleware.
 * Reads httpOnly cookie → verifies JWT → attaches user to socket.
 */
module.exports = async function authSocket(socket, next) {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error("Not authenticated"));

    const cookies = cookie.parse(cookieHeader);
    const token   = cookies.token;
    if (!token) return next(new Error("Missing auth token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id is set by auth.routes.js at login
    const user = await User.findById(decoded.id).select("_id email role");
    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
};
