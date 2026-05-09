require("dotenv").config();
const express = require("express");
const cors = require("cors");

const linkRoutes = require("./routes/link.routes");
const categoryRoutes = require("./routes/category.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// routes

app.use("/api/categories", categoryRoutes)
app.use("/api/links", linkRoutes);

app.use(errorHandler);

module.exports = app;