/**
 * Migration 286: Complete Studio Profile, Suspension Status, Video Quotas,
 * Video Timestamp Comments, Module Permissions & Active Sessions.
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('studios')) {
    const addColIfMissing = async (colName, builder) => {
      const exists = await knex.schema.hasColumn('studios', colName);
      if (!exists) {
        await knex.schema.alterTable('studios', builder);
      }
    };

    await addColIfMissing('status', (t) => t.string('status', 24).notNullable().defaultTo('active'));
    await addColIfMissing('suspension_reason', (t) => t.text('suspension_reason'));
    await addColIfMissing('city', (t) => t.string('city', 120));
    await addColIfMissing('country', (t) => t.string('country', 120));
    await addColIfMissing('business_email', (t) => t.string('business_email', 255));
    await addColIfMissing('phone', (t) => t.string('phone', 64));
    await addColIfMissing('website', (t) => t.string('website', 255));
    await addColIfMissing('description', (t) => t.text('description'));
    await addColIfMissing('logo_url', (t) => t.string('logo_url', 512));
    await addColIfMissing('social_links', (t) => t.text('social_links'));
    await addColIfMissing('video_storage_limit_min', (t) => t.integer('video_storage_limit_min').notNullable().defaultTo(0));
    await addColIfMissing('video_playback_limit_min', (t) => t.integer('video_playback_limit_min').notNullable().defaultTo(0));
    await addColIfMissing('video_playback_used_min', (t) => t.integer('video_playback_used_min').notNullable().defaultTo(0));
    await addColIfMissing('video_playback_reset_at', (t) => t.timestamp('video_playback_reset_at'));
  }

  if (!(await knex.schema.hasTable('studio_status_history'))) {
    await knex.schema.createTable('studio_status_history', (t) => {
      t.increments('id').primary();
      t.integer('studio_id').notNullable().references('id').inTable('studios').onDelete('CASCADE');
      t.string('from_status', 24).notNullable();
      t.string('to_status', 24).notNullable();
      t.integer('changed_by_admin_id');
      t.text('reason');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['studio_id']);
    });
  }

  if (!(await knex.schema.hasTable('video_comments'))) {
    await knex.schema.createTable('video_comments', (t) => {
      t.increments('id').primary();
      t.integer('studio_id').notNullable().references('id').inTable('studios').onDelete('CASCADE');
      t.integer('event_id').notNullable();
      t.integer('photo_id').notNullable();
      t.string('author_name', 120).notNullable();
      t.integer('timestamp_sec').notNullable().defaultTo(0);
      t.text('comment_text').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['studio_id', 'event_id', 'photo_id']);
    });
  }

  if (!(await knex.schema.hasTable('member_module_permissions'))) {
    await knex.schema.createTable('member_module_permissions', (t) => {
      t.increments('id').primary();
      t.integer('studio_id').notNullable().references('id').inTable('studios').onDelete('CASCADE');
      t.integer('admin_id').notNullable();
      t.string('module_id', 64).notNullable();
      t.boolean('can_view').notNullable().defaultTo(false);
      t.boolean('can_create').notNullable().defaultTo(false);
      t.boolean('can_edit').notNullable().defaultTo(false);
      t.boolean('can_delete').notNullable().defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['studio_id', 'admin_id', 'module_id']);
      t.index(['studio_id', 'admin_id']);
    });
  }

  if (!(await knex.schema.hasTable('admin_sessions'))) {
    await knex.schema.createTable('admin_sessions', (t) => {
      t.increments('id').primary();
      t.integer('admin_id').notNullable();
      t.string('device_name', 120).notNullable();
      t.string('browser_location', 255);
      t.string('ip_address', 64);
      t.text('user_agent');
      t.boolean('is_revoked').notNullable().defaultTo(false);
      t.timestamp('last_active_at').defaultTo(knex.fn.now());
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['admin_id', 'is_revoked']);
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('admin_sessions');
  await knex.schema.dropTableIfExists('member_module_permissions');
  await knex.schema.dropTableIfExists('video_comments');
  await knex.schema.dropTableIfExists('studio_status_history');
};

