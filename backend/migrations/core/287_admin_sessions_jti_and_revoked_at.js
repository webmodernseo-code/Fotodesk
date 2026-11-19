/**
 * Migration 287: Add token_jti and revoked_at columns to admin_sessions
 * so active JWT sessions can be listed and remotely revoked.
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('admin_sessions')) {
    const hasJti = await knex.schema.hasColumn('admin_sessions', 'token_jti');
    if (!hasJti) {
      await knex.schema.alterTable('admin_sessions', (t) => {
        t.string('token_jti', 128);
        t.index(['token_jti']);
      });
    }

    const hasRevokedAt = await knex.schema.hasColumn('admin_sessions', 'revoked_at');
    if (!hasRevokedAt) {
      await knex.schema.alterTable('admin_sessions', (t) => {
        t.timestamp('revoked_at');
      });
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('admin_sessions')) {
    const hasRevokedAt = await knex.schema.hasColumn('admin_sessions', 'revoked_at');
    if (hasRevokedAt) {
      await knex.schema.alterTable('admin_sessions', (t) => {
        t.dropColumn('revoked_at');
      });
    }
    const hasJti = await knex.schema.hasColumn('admin_sessions', 'token_jti');
    if (hasJti) {
      await knex.schema.alterTable('admin_sessions', (t) => {
        t.dropColumn('token_jti');
      });
    }
  }
};

