import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, userNotificationPreferences, userSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const router = Router();

// Get current user's profile
router.get('/current', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Use a direct SQL query to avoid schema mapping issues
    const result = await db.execute(`
      SELECT 
        id, 
        username, 
        email, 
        first_name as "firstName", 
        last_name as "lastName", 
        phone, 
        business_name as "businessName", 
        address, 
        city, 
        state, 
        zip, 
        country, 
        created_at as "createdAt"
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

    // Check if user exists before update
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.id, Number(req.session.userId)));

    if (!existingUser) {
      console.error('User not found for profile update:', req.session.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Existing user found:', existingUser.id, existingUser.email);
    
    // Execute a raw SQL query to ensure we're updating the right columns
    // This is a workaround to avoid schema mismatches
    const result = await db.execute(`
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

    console.log('User profile updated successfully:', updatedUser);
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
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, Number(req.session.userId)));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.update(users)
      .set({
        password: hashedPassword,
        lastPasswordUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, Number(req.session.userId)));

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

    // Get or create notification preferences
    let [preferences] = await db.select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, Number(req.session.userId)));

    if (!preferences) {
      // Create default preferences if they don't exist
      [preferences] = await db.insert(userNotificationPreferences)
        .values({
          userId: Number(req.session.userId),
          orderUpdates: true,
          upcomingEvents: true,
          newEnquiries: true,
          marketingTips: false,
          smsOrderConfirmations: false,
          smsDeliveryReminders: false
        })
        .returning();
    }

    res.json(preferences);
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
    const [existingPrefs] = await db.select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, Number(req.session.userId)));

    let updatedPreferences;

    if (existingPrefs) {
      // Update existing preferences
      [updatedPreferences] = await db.update(userNotificationPreferences)
        .set({
          orderUpdates,
          upcomingEvents,
          newEnquiries,
          marketingTips,
          smsOrderConfirmations,
          smsDeliveryReminders,
          updatedAt: new Date()
        })
        .where(eq(userNotificationPreferences.userId, Number(req.session.userId)))
        .returning();
    } else {
      // Create new preferences
      [updatedPreferences] = await db.insert(userNotificationPreferences)
        .values({
          userId: Number(req.session.userId),
          orderUpdates,
          upcomingEvents,
          newEnquiries,
          marketingTips,
          smsOrderConfirmations,
          smsDeliveryReminders
        })
        .returning();
    }

    res.json(updatedPreferences);
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

    const sessions = await db.select()
      .from(userSessions)
      .where(eq(userSessions.userId, Number(req.session.userId)))
      .where(eq(userSessions.isActive, true));

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

    // Update all other sessions to inactive
    await db.update(userSessions)
      .set({
        isActive: false
      })
      .where(eq(userSessions.userId, Number(req.session.userId)));

    res.json({ message: 'All other sessions terminated successfully' });
  } catch (error: any) {
    console.error('Error terminating sessions:', error);
    res.status(500).json({ error: 'Failed to terminate sessions', message: error.message });
  }
});

export default router;