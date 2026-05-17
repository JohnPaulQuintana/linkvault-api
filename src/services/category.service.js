const { supabase } = require("../config/supabase");
const AppError = require("../utils/AppError");

// =========================
// COUNT (SAFE)
// =========================
exports.countByUser = async (userId) => {
  const { count, error } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count, error };
};

// =========================
// GET ALL CATEGORIES (SAFE)
// =========================
exports.getAll = async ({ userId }) => {
  // 1. VALIDATION
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  // 2. QUERY
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  // 3. ERROR HANDLING (structured)
  if (error) {
    throw new AppError(
      "Failed to fetch categories",
      500,
      "FETCH_CATEGORIES_FAILED",
      { supabaseError: error.message },
    );
  }

  return data;
};

// =========================
// CREATE CATEGORY (NO DUPLICATES)
// =========================
exports.create = async ({ userId, name, icon }) => {
  // 1. NORMALIZE INPUT
  const normalizedName = name.trim().toLowerCase();

  // 2. CHECK DUPLICATE (case-insensitive)
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", normalizedName); //  case-insensitive match

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing && existing.length > 0) {
    throw new AppError("Category already exists", 409, "DUPLICATE_CATEGORY", {
      name: normalizedName,
      userId,
    });
  }

  // 3. INSERT (store normalized OR display version)
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: normalizedName, //  consistent storage
      icon,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

// =========================
// DELETE CATEGORY
// =========================
exports.delete = async ({ id, userId }) => {
  // 1. CHECK EXISTENCE FIRST
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id, is_system")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  // 2. NOT FOUND
  if (!existing) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  // 3. SYSTEM CATEGORY PROTECTION
  if (existing.is_system) {
    throw new AppError(
      "System categories cannot be deleted",
      403,
      "SYSTEM_CATEGORY_PROTECTED",
    );
  }

  // 4. DELETE
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

exports.edit = async ({ id, userId, name, icon }) => {
  const normalizedName = name.trim().toLowerCase();

  // 1. CHECK EXISTENCE + OWNERSHIP
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id, is_system")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (!existing) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  // 2. BLOCK SYSTEM CATEGORY
  if (existing.is_system) {
    throw new AppError(
      "System categories cannot be modified",
      403,
      "SYSTEM_CATEGORY_PROTECTED",
    );
  }

  // 3. CHECK DUPLICATE NAME (excluding itself)
  const { data: duplicate, error: dupError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", normalizedName)
    .neq("id", id);

  if (dupError) {
    throw new Error(dupError.message);
  }

  if (duplicate && duplicate.length > 0) {
    throw new AppError("Category already exists", 409, "DUPLICATE_CATEGORY");
  }

  // 4. UPDATE
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: normalizedName,
      icon,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

exports.getPublished = async ({ categoryId }) => {
  // 1. VALIDATION
  if (!categoryId) {
    throw new AppError("Category ID is required", 400, "VALIDATION_ERROR");
  }

  // 2. QUERY (ONLY by category_id)
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  // 3. ERROR HANDLING
  if (error) {
    throw new AppError("Failed to fetch links", 500, "FETCH_LINKS_FAILED", {
      supabaseError: error.message,
    });
  }

  return data;
};

exports.updatePublishedState = async ({ categoryId, state }) => {
  if (!categoryId) {
    throw new AppError("Category ID is required", 400, "VALIDATION_ERROR");
  }

  if (!state || !["public", "private"].includes(state)) {
    throw new AppError("Invalid state value", 400, "VALIDATION_ERROR");
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      published: state,
    })
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(
      error.message || "Failed to update category",
      500,
      "DB_ERROR"
    );
  }

  return data;
};
