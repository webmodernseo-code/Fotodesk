const { db } = require('../src/database/db');

/**
 * Idempotent demo seed for FotoDesk Phase 1:
 * Ensures Studio 2 ("Northlight Studio") is owned by user_b@fotodesk.com
 * and Studio 1 is linked to founder@fotodesk.com (super_admin).
 */
async function seedDemoStudios() {
  const founder = await db('admin_users').where({ email: 'founder@fotodesk.com' }).first();
  if (founder) {
    const studio1 = await db('studios').where({ id: 1 }).first();
    if (studio1) {
      await db('studios').where({ id: 1 }).update({
        name: 'FotoDesk HQ',
        slug: studio1.slug || 'fotodesk-hq',
        status: 'active',
        owner_admin_id: founder.id,
        updated_at: new Date(),
      });
    }
  }

  const userB = await db('admin_users').where({ email: 'user_b@fotodesk.com' }).first();
  if (userB) {
    const studio2 = await db('studios').where({ id: 2 }).first();
    if (studio2) {
      await db('studios').where({ id: 2 }).update({
        name: 'Northlight Studio',
        slug: 'northlight-studio',
        status: 'active',
        city: 'Paris',
        country: 'France',
        business_email: 'user_b@fotodesk.com',
        owner_admin_id: userB.id,
        updated_at: new Date(),
      });
    }
  }

  const studios = await db('studios').select('id', 'name', 'slug', 'status', 'plan_id', 'city', 'country');
  console.log(JSON.stringify({ seeded: true, studios }, null, 2));
}

seedDemoStudios()
  .then(() => db.destroy())
  .catch(async (err) => {
    console.error(err);
    await db.destroy();
    process.exit(1);
  });
