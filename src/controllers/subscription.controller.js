const subscriptionService = require("../services/subscription.service");

// helper logger (replace with Winston/Pino later if you want)
const log = (label, data) => {
  console.log(`[SUBSCRIPTION:${label}]`, JSON.stringify(data, null, 2));
};

// GET ALL SUBSCRIPTION PLANS
exports.getPlans = async (req, res, next) => {
  try {
    log("GET_PLANS_START", { ip: req.ip });

    const plans = await subscriptionService.getAllPlans();

    log("GET_PLANS_SUCCESS", {
      count: plans?.length,
    });

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (err) {
    log("GET_PLANS_ERROR", {
      message: err.message,
      stack: err.stack,
    });

    next(err);
  }
};


// GET /subscriptions/my-plan/:userId
exports.getMyPlan = async (req, res, next) => {
  try {
    const { userId } = req.params;

    log("GET_MY_PLAN_START", {
      userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const data = await subscriptionService.getMyPlan(userId);

    log("GET_MY_PLAN_SUCCESS", {
      userId,
      planId: data?.id,
      raw: data,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    log("GET_MY_PLAN_ERROR", {
      userId: req.params.userId,
      message: err.message,
      stack: err.stack,
    });

    next(err);
  }
};