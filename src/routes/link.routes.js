const express = require("express");
const router = express.Router();

const linkController = require("../controllers/link.controller");

// generate preview (scrape metadata)
router.get("/preview", linkController.generatePreview);

// create link (save to DB)
router.post("/create", linkController.createLink);

// get all links
router.get("/collect", linkController.getLinks);

// delete link
router.delete("/delete/:id", linkController.deleteLink);

module.exports = router;