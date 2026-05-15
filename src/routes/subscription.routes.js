const express = require("express");
const router = express.Router();

const subscriptionController = require("../controllers/subscription.controller");

// GET ALL PLANS
router.get("/plans", subscriptionController.getPlans);

// GET CURRENT USER PLAN
router.get("/my-plan/:userId", subscriptionController.getMyPlan);

module.exports = router;