const { supabase } = require("../config/supabase");
const AppError = require("../utils/AppError");

// GET ALL PLANS
exports.getAllPlans = async () => {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("price_monthly", { ascending: true });

  if (error) {
    throw new AppError(
      "Failed to fetch subscription plans",
      500,
      "PLANS_FETCH_ERROR",
    );
  }

  return data;
};

exports.getMyPlan = async (userId) => {
  // 1. get active subscription
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (subError || !subscription) {
    throw new AppError(
      "No active subscription found",
      404,
      "NO_ACTIVE_SUBSCRIPTION",
    );
  }

  // 2. get plan details
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", subscription.plan_id)
    .single();

  if (planError || !plan) {
    throw new AppError("Plan not found", 404, "PLAN_NOT_FOUND");
  }

  // 3. merge both
  return {
    subscription,
    plan,
  };
};

// INSERT SUBSCRIPTION
exports.insertSubscription = async ({
  userId,
  planId,
  status
}) => {
  // optional: deactivate previous active subscriptions
  await supabase
    .from("user_subscriptions")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("user_subscriptions")
    .insert([
      {
        user_id: userId,
        plan_id: planId,
        status,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new AppError(
      "Failed to create subscription",
      500,
      "SUBSCRIPTION_CREATE_ERROR",
    );
  }

  return data;
};
