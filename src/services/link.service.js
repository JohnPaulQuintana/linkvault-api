const scraper = require("./scrapper/scraper.service");
const { supabase } = require("../config/supabase");
const subscriptionService = require("./subscription.service");
const sessionService = require("./session.service");

const { checkUrlAccessible } = require("./safety/checkUrlAccessible");
const { getDomain } = require("./scrapper/helpers/getDomain");

const AppError = require("../utils/AppError");

const normalizeUrl = (url) => {
  try {
    const u = new URL(url);

    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`
      .toLowerCase()
      .replace(/\/$/, "");
  } catch {
    return url;
  }
};

exports.createLink = async ({
  url,
  category_id,
  user_id,
  link_type,
  title,
  description,
}) => {
  // 1. DUPLICATE CHECK (IMPORTANT)
  const normalizedUrlText = normalizeUrl(url);
  const domain = getDomain(url);
  // const normalizedTitle = (title || "").trim().toLowerCase();

  console.log(url, domain)
  const { data: existing } = await supabase
    .from("links")
    .select("id")
    .eq("user_id", user_id)
    .eq("url", url)
    .eq("domain", domain)
    .maybeSingle();

  if (existing) {
    throw new AppError("Link already exists", 409, "DUPLICATE_LINK");
  }

  // =========================
  // 2. SUBSCRIPTION CHECK (NEW)
  // =========================
  const plan = await subscriptionService.getMyPlan(user_id);

  const { count, error: countError } = await supabase
    .from("links")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("category_id", category_id);

  if (countError) {
    throw new AppError("Failed to count links", 500, "DB_ERROR");
  }

  if (count >= plan.max_links_per_category) {
    throw new AppError(
      `Link limit reached (${plan.max_links_per_category} per category)`,
      403,
      "PLAN_LIMIT_REACHED",
      {
        limit: plan.max_links_per_category,
        current: count,
      },
    );
  }

  // =========================
  // CHECK URL ACCESSIBILITY
  // =========================
  const accessibility = await checkUrlAccessible(url);

  if (!accessibility.accessible) {
    const reasonMap = {
      blocked: "The website domain could not be reached.",
      // dns_error: "The website domain could not be reached.",
      timeout: "The website took too long to respond.",
      connection_refused: "The website refused the connection request.",
      not_found: "The website or page does not exist.",
      server_error: "The website is currently experiencing server issues.",
      request_failed: "Unable to access the website at this time.",
    };

    throw new AppError(
      reasonMap[accessibility.reason] || "Unable to access this website.",
      400,
      "LINK_UNAVAILABLE",
      accessibility,
    );
  }

  // 2. SCRAPE / GENERATE PREVIEW
  let preview = await scraper.generateTypedContent(url, link_type);

  console.log(preview);
  // if (link_type === "website") {
  // } else {
  //   preview = await scraper.generateTypedContent(url, link_type);
  // }

  // 3. SAFE MERGE (user input wins)
  const payload = {
    url,
    category_id,
    user_id,

    title: title || preview?.title || "Untitled",
    description: description || preview?.description || null,
    image: preview?.image || null,
    favicon: preview?.favicon || null,
    domain: preview?.domain || null,
    platform: preview.type || null,
    safety_status: preview.safety.status,
  };

  // 4. INSERT
  const { data, error } = await supabase
    .from("links")
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500, "DB_ERROR");
  }

  return data;
};

/**
 * -------------------------
 * GET LINKS (WITH SESSION)
 * -------------------------
 */
exports.getLinks = async ({ userId, categoryId }) => {
  const query = supabase
    .from("links")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query.eq("category_id", categoryId);
  }

  const [{ data: links, error }, sessions] = await Promise.all([
    query,
    sessionService.getSessionsByUser(userId),
  ]);

  if (error) {
    throw new AppError(error.message, 500, "DB_ERROR");
  }

  const sessionMap = new Map((sessions || []).map((s) => [s.link_id, s]));

  return links.map((link) => {
    const session = sessionMap.get(link.id);

    const progress = session?.progress ?? 0;

    return {
      ...link,

      session,

      progress,
      scroll_top: session?.scroll_top ?? 0,

      last_read_at: session?.updated_at ?? null,

      is_completed: progress >= 100,
      is_reading: progress > 0 && progress < 100,

      resume_url: session?.final_url || link.url,
    };
  });
};

/**
 * -------------------------
 * DELETE LINK
 * -------------------------
 */
exports.deleteLink = async ({ id, userId }) => {
  const { data, error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500, "DB_ERROR");
  }

  return data;
};
