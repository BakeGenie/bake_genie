import { Router, Request, Response } from 'express';
import { db } from '../db';
import { pool } from '../db';
import { userNotificationPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const router = Router();

// Get current user's profile
router.get('/current', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Using a simpler query that we've verified works
    console.log('Fetching user profile for ID:', Number(req.session.userId));
    const result = await pool.query(`
      SELECT 
        id, 
        username, 
        email, 
        first_name AS "firstName", 
        last_name AS "lastName", 
        phone, 
        business_name AS "businessName", 
        address, 
        city, 
        state, 
        zip, 
        country, 
        created_at AS "createdAt"
      FROM users
      WHERE id = $1
    `, [Number(req.session.userId)]);

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile', message: error.message });
  }
});

// Update user profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('Updating user profile. Request body:', req.body);

    const { 
      firstName, 
      lastName, 
      email, 
      phone,
      businessName,
      address,
      city,
      state,
      zip,
      country
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if user exists before update
    const userResult = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [Number(req.session.userId)]
    );
    
    if (userResult.rows.length === 0) {
      console.error('User not found for profile update:', req.session.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const existingUser = userResult.rows[0];
    console.log('Existing user found:', existingUser.id, existingUser.email);
    
    // Execute a raw SQL query to ensure we're updating the right columns
    // This is a workaround to avoid schema mismatches
    const result = await pool.query(`
      UPDATE users
      SET 
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        business_name = $5,
        address = $6,
        city = $7,
        state = $8,
        zip = $9,
        country = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING id, first_name as "firstName", last_name as "lastName", email, phone, business_name as "businessName", address, city, state, zip, country
    `, [
      firstName,
      lastName,
      email,
      phone || null,
      businessName || null,
      address || null,
      city || null,
      state || null,
      zip || null,
      country || null,
      Number(req.session.userId)
    ]);
    
    // The result already has the correct format thanks to our SQL column aliases
    const updatedUser = result.rows[0];
    
    if (!updatedUser) {
      throw new Error('Failed to update user profile - no rows returned');
    }

    console.log('User profile updated successfully!');
    console.log('Business info updated:', {
      businessName: updatedUser.businessName,
      address: updatedUser.address,
      city: updatedUser.city,
      state: updatedUser.state,
      zip: updatedUser.zip,
      country: updatedUser.country
    });
    
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile', message: error.message });
  }
});

// Change password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user
    const userResult = await pool.query(`
      SELECT id, password FROM users WHERE id = $1
    `, [Number(req.session.userId)]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(`
      UPDATE users 
      SET 
        password = $1, 
        last_password_update = $2,
        updated_at = $3
      WHERE id = $4
    `, [hashedPassword, new Date(), new Date(), Number(req.session.userId)]);

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password', message: error.message });
  }
});

// Get user's notification preferences
router.get('/notification-preferences', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get notification preferences
    const preferencesResult = await pool.query(`
      SELECT * FROM user_notification_preferences
      WHERE user_id = $1
    `, [Number(req.session.userId)]);
    
    let preferences = preferencesResult.rows[0];

    if (!preferences) {
      // Create default preferences if they don't exist
      const insertResult = await pool.query(`
        INSERT INTO user_notification_preferences (
          user_id, 
          order_updates, 
          upcoming_events, 
          new_enquiries, 
          marketing_tips, 
          sms_order_confirmations, 
          sms_delivery_reminders
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        Number(req.session.userId),
        true,
        true,
        true,
        false,
        false,
        false
      ]);
      
      preferences = insertResult.rows[0];
    }
    
    // Transform from snake_case to camelCase for frontend compatibility
    const preferencesForClient = {
      id: preferences.id,
      userId: preferences.user_id,
      orderUpdates: preferences.order_updates,
      upcomingEvents: preferences.upcoming_events,
      newEnquiries: preferences.new_enquiries,
      marketingTips: preferences.marketing_tips,
      smsOrderConfirmations: preferences.sms_order_confirmations,
      smsDeliveryReminders: preferences.sms_delivery_reminders
    };

    res.json(preferencesForClient);
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences', message: error.message });
  }
});

// Update notification preferences
router.patch('/notification-preferences', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { 
      orderUpdates,
      upcomingEvents,
      newEnquiries,
      marketingTips,
      smsOrderConfirmations,
      smsDeliveryReminders
    } = req.body;

    // Check if preferences exist
    const existingPrefsResult = await pool.query(`
      SELECT * FROM user_notification_preferences
      WHERE user_id = $1
    `, [Number(req.session.userId)]);
    
    const existingPrefs = existingPrefsResult.rows[0];
    let updatedPreferences;

    if (existingPrefs) {
      // Update existing preferences
      const updateResult = await pool.query(`
        UPDATE user_notification_preferences
        SET 
          order_updates = $1,
          upcoming_events = $2,
          new_enquiries = $3,
          marketing_tips = $4,
          sms_order_confirmations = $5,
          sms_delivery_reminders = $6,
          updated_at = $7
        WHERE user_id = $8
        RETURNING *
      `, [
        orderUpdates,
        upcomingEvents,
        newEnquiries,
        marketingTips,
        smsOrderConfirmations,
        smsDeliveryReminders,
        new Date(),
        Number(req.session.userId)
      ]);
      
      updatedPreferences = updateResult.rows[0];
    } else {
      // Create new preferences if they don't exist
      const insertResult = await pool.query(`
        INSERT INTO user_notification_preferences (
          user_id, 
          order_updates, 
          upcoming_events, 
          new_enquiries, 
          marketing_tips, 
          sms_order_confirmations, 
          sms_delivery_reminders
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        Number(req.session.userId),
        orderUpdates,
        upcomingEvents,
        newEnquiries,
        marketingTips,
        smsOrderConfirmations,
        smsDeliveryReminders
      ]);
      
      updatedPreferences = insertResult.rows[0];
    }
    
    // Transform from snake_case to camelCase for frontend compatibility
    const preferencesForClient = {
      id: updatedPreferences.id,
      userId: updatedPreferences.user_id,
      orderUpdates: updatedPreferences.order_updates,
      upcomingEvents: updatedPreferences.upcoming_events,
      newEnquiries: updatedPreferences.new_enquiries,
      marketingTips: updatedPreferences.marketing_tips,
      smsOrderConfirmations: updatedPreferences.sms_order_confirmations,
      smsDeliveryReminders: updatedPreferences.sms_delivery_reminders
    };

    res.json(preferencesForClient);
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences', message: error.message });
  }
});

// Get user's active sessions
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all active sessions using direct SQL query
    const sessionsResult = await pool.query(`
      SELECT * FROM user_sessions
      WHERE user_id = $1 AND is_active = TRUE
    `, [Number(req.session.userId)]);
    
    // Transform from snake_case to camelCase for frontend
    const sessions = sessionsResult.rows.map(session => ({
      id: session.id,
      userId: session.user_id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      lastActive: session.last_active,
      isActive: session.is_active,
      createdAt: session.created_at
    }));

    res.json(sessions);
  } catch (error: any) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions', message: error.message });
  }
});

// Terminate all other sessions
router.post('/terminate-sessions', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Keep track of current session ID
    const currentSessionId = req.sessionID;

    // Update all other sessions to inactive using direct SQL
    await pool.query(`
      UPDATE user_sessions 
      SET is_active = FALSE
      WHERE user_id = $1 AND id != $2
    `, [Number(req.session.userId), currentSessionId]);

    res.json({ message: 'All other sessions terminated successfully' });
  } catch (error: any) {
    console.error('Error terminating sessions:', error);
    res.status(500).json({ error: 'Failed to terminate sessions', message: error.message });
  }
});

export default router;