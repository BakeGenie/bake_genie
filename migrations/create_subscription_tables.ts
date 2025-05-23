import { db } from '../server/db';
import { subscriptionPlans, userSubscriptions, sessions } from '../shared/schema';

async function main() {
  console.log('Creating subscription tables...');
  
  // Create the sessions table for session storage (needed by Replit Auth)
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess json NOT NULL,
        expire timestamp(6) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `);
    console.log('Sessions table created');
  } catch (error) {
    console.error('Error creating sessions table:', error);
  }

  // Create subscription plans table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        interval TEXT NOT NULL,
        features TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        stripe_price_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Subscription plans table created');
    
    // Insert a default plan if none exists
    const plansCount = await db.execute('SELECT COUNT(*) FROM subscription_plans');
    if (plansCount.rows[0].count === '0') {
      await db.execute(`
        INSERT INTO subscription_plans (name, description, price, interval, features)
        VALUES ('Standard', 'Complete baking business management', 19.99, 'monthly', 
        ARRAY['Customer Management', 'Order Tracking', 'Recipe Management', 'Expense Tracking']);
      `);
      console.log('Default subscription plan created');
    }
  } catch (error) {
    console.error('Error creating subscription_plans table:', error);
  }

  // Create user subscriptions table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER REFERENCES subscription_plans(id),
        plan_name TEXT,
        price DECIMAL(10, 2),
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        status TEXT DEFAULT 'inactive',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        canceled_at TIMESTAMP,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('User subscriptions table created');
  } catch (error) {
    console.error('Error creating user_subscriptions table:', error);
  }

  // Create user payment methods table if doesn't exist
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        payment_method_id TEXT NOT NULL,
        brand TEXT NOT NULL,
        last4 TEXT NOT NULL,
        exp_month INTEGER NOT NULL,
        exp_year INTEGER NOT NULL,
        is_default BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('User payment methods table created');
  } catch (error) {
    console.error('Error creating user_payment_methods table:', error);
  }

  // Create user sessions table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        device_info TEXT,
        ip_address TEXT,
        last_active TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('User sessions table created');
  } catch (error) {
    console.error('Error creating user_sessions table:', error);
  }

  // Create notification preferences table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        order_updates BOOLEAN DEFAULT TRUE,
        upcoming_events BOOLEAN DEFAULT TRUE,
        new_enquiries BOOLEAN DEFAULT TRUE,
        marketing_tips BOOLEAN DEFAULT FALSE,
        sms_order_confirmations BOOLEAN DEFAULT FALSE,
        sms_delivery_reminders BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('User notification preferences table created');
  } catch (error) {
    console.error('Error creating user_notification_preferences table:', error);
  }

  console.log('Migration completed!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });