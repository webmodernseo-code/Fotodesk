/**
 * Migration 290: Ensure studios has created_at and updated_at timestamp columns.
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('studios')) {
    const hasCreatedAt = await knex.schema.hasColumn('studios', 'created_at');
    if (!hasCreatedAt) {
      await knex.schema.alterTable('studios', (t) => {
        t.timestamp('created_at');
      });
      await knex('studios').whereNull('created_at').update({ created_at: new Date() });
    }

    const hasUpdatedAt = await knex.schema.hasColumn('studios', 'updated_at');
    if (!hasUpdatedAt) {
      await knex.schema.alterTable('studios', (t) => {
        t.timestamp('updated_at');
      });
      await knex('studios').whereNull('updated_at').update({ updated_at: new Date() });
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('studios')) {
    if (await knex.schema.hasColumn('studios', 'updated_at')) {
      await knex.schema.alterTable('studios', (t) => t.dropColumn('updated_at'));
    }
    if (await knex.schema.hasColumn('studios', 'created_at')) {
      await knex.schema.alterTable('studios', (t) => t.dropColumn('created_at'));
    }
  }
};
