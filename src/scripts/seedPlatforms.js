require("dotenv").config();

const { seedPlatforms } = require("../services/seeders/platform.seeder");

// your PLATFORMS object
const { PLATFORMS } = require("../constants/platforms");

(async () => {
  try {
    console.log("Seeding platforms...");

    await seedPlatforms(PLATFORMS);

    console.log("✅ Platforms seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
})();