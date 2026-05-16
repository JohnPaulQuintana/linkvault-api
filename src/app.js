require("dotenv").config();
const express = require("express");
const cors = require("cors");

const linkRoutes = require("./routes/link.routes");
const categoryRoutes = require("./routes/category.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const sessionRoutes = require("./routes/session.routes");
const authRoutes = require("./routes/auth.routes");
const onboardingRoutes = require("./routes/onboarding.routes");
const profileRoutes = require("./routes/profile.routes");

const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// routes

app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/links", linkRoutes);
app.use("/api/v1/session", sessionRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/profile", profileRoutes);

app.use(errorHandler);

module.exports = app;