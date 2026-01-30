const Agent = require("../models/Agent");

module.exports = async function requireAgent(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing agent token" });
  }

  const token = auth.split(" ")[1];
  const agent = await Agent.findOne({ token });

  if (!agent) {
    return res.status(401).json({ message: "Invalid agent token" });
  }

  req.agent = agent;
  next();
};
