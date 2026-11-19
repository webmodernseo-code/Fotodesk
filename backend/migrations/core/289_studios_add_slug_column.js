/**
 * Migration 289: Ensure studios.slug exists and backfill missing slugs.
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('studios')) {
    const hasSlug = await knex.schema.hasColumn('studios', 'slug');
    if (!hasSlug) {
      await knex.schema.alterTable('studios', (t) => {
        t.string('slug', 160);
        t.unique(['slug']);
      });

      const rows = await knex('studios').select('id', 'name');
      for (const row of rows) {
        const base = String(row.name || `studio-${row.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `studio-${row.id}`;
        await knex('studios')
          .where({ id: row.id })
          .update({ slug: `${base}-${row.id}` });
      }
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('studios')) {
    const hasSlug = await knex.schema.hasColumn('studios', 'slug');
    if (hasSlug) {
      await knex.schema.alterTable('studios', (t) => {
        t.dropColumn('slug');
      });
    }
  }
};
