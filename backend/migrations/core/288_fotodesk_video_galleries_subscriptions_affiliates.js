/**
 * Migration 288: Video galleries, subscription invoices, and affiliate commissions.
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('video_galleries'))) {
    await knex.schema.createTable('video_galleries', (t) => {
      t.increments('id').primary();
      t.integer('studio_id').notNullable().references('id').inTable('studios').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.string('slug', 160).notNullable().unique();
      t.string('client_name', 255);
      t.integer('project_id');
      t.string('access_code_hash', 255);
      t.boolean('is_protected').notNullable().defaultTo(false);
      t.timestamp('expires_at');
      t.string('status', 24).notNullable().defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.index(['studio_id']);
    });
  }

  if (!(await knex.schema.hasTable('video_gallery_items'))) {
    await knex.schema.createTable('video_gallery_items', (t) => {
      t.increments('id').primary();
      t.integer('gallery_id').notNullable().references('id').inTable('video_galleries').onDelete('CASCADE');
      t.integer('studio_id').notNullable().references('id').inTable('studios').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.string('filename', 255).notNullable();
      t.string('file_path', 512).notNullable();
      t.bigInteger('size_bytes').notNullable().defaultTo(0);
      t.integer('duration_sec').notNullable().defaultTo(0);
      t.string('mime_type', 128).defaultTo('video/mp4');
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['gallery_id']);
      t.index(['studio_id']);
    });
  }

  if (!(await knex.schema.hasTable('subscription_invoices'))) {
    await knex.schema.createTable('subscription_invoices', (t) => {
      t.increments('id').primary();
      t.integer('studio_id').notNullable().references('id').inTable('studios').onDelete('CASCADE');
      t.string('plan_id', 64).notNullable();
      t.string('billing_interval', 32).notNullable().defaultTo('monthly');
      t.integer('amount_minor').notNullable();
      t.string('currency', 8).notNullable().defaultTo('EUR');
      t.string('status', 24).notNullable().defaultTo('paid');
      t.string('invoice_number', 64).notNullable().unique();
      t.timestamp('paid_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['studio_id']);
    });
  }

  if (!(await knex.schema.hasTable('affiliate_commissions'))) {
    await knex.schema.createTable('affiliate_commissions', (t) => {
      t.increments('id').primary();
      t.integer('affiliate_account_id').notNullable();
      t.integer('referred_studio_id').notNullable().unique();
      t.integer('subscription_invoice_id').notNullable().references('id').inTable('subscription_invoices').onDelete('CASCADE');
      t.string('plan_id', 64).notNullable();
      t.integer('base_amount_minor').notNullable();
      t.decimal('commission_rate', 5, 4).notNullable().defaultTo(0.2);
      t.integer('commission_minor').notNullable();
      t.string('status', 24).notNullable().defaultTo('pending');
      t.timestamp('approved_at');
      t.timestamp('paid_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['affiliate_account_id', 'status']);
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('affiliate_commissions');
  await knex.schema.dropTableIfExists('subscription_invoices');
  await knex.schema.dropTableIfExists('video_gallery_items');
  await knex.schema.dropTableIfExists('video_galleries');
};

