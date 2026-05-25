const express = require("express");
const router = express.Router();
const scrapperController = require("../controllers/scrapper.controller");

// create link (save to DB)
router.post("/link", scrapperController.scrapperLink);

module.exports = router;