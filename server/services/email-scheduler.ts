import cron from 'node-cron';
import { db } from '../db';
import { users, settings as settingsTable } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendUpcomingOrdersReport, sendPaymentReminders } from './email-service';

// Scheduled tasks storage
let scheduledTasks: { [key: string]: cron.ScheduledTask } = {};

/**
 * Start all scheduled email jobs
 */
export function startEmailScheduler() {
  console.log('Starting email scheduler...');
  
  try {
    // Create simpler schedules without timezone to avoid compatibility issues
    
    // Daily at 7am - Upcoming orders for users with daily frequency
    try {
      scheduledTasks['dailyReports'] = cron.schedule('0 7 * * *', async () => {
        try {
          console.log('Running daily order reports job');
          await sendReportsForFrequency('daily');
        } catch (error) {
          console.error('Error in daily order reports job:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up daily reports schedule:', error);
    }
    
    // Every Monday at 7am - Weekly upcoming orders
    try {
      scheduledTasks['weeklyReports'] = cron.schedule('0 7 * * 1', async () => {
        try {
          console.log('Running weekly order reports job');
          await sendReportsForFrequency('weekly');
        } catch (error) {
          console.error('Error in weekly order reports job:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up weekly reports schedule:', error);
    }
    
    // 1st of the month at 7am - Monthly upcoming orders
    try {
      scheduledTasks['monthlyReports'] = cron.schedule('0 7 1 * *', async () => {
        try {
          console.log('Running monthly order reports job');
          await sendReportsForFrequency('monthly');
        } catch (error) {
          console.error('Error in monthly order reports job:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up monthly reports schedule:', error);
    }
    
    // Daily at 10am - Payment reminders
    try {
      scheduledTasks['paymentReminders'] = cron.schedule('0 10 * * *', async () => {
        try {
          console.log('Running payment reminders job');
          await sendAllPaymentReminders();
        } catch (error) {
          console.error('Error in payment reminders job:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up payment reminders schedule:', error);
    }
    
    console.log('Email scheduler started successfully');
  } catch (error) {
    console.error('Error starting email scheduler:', error);
    // Create empty scheduledTasks so that the application doesn't crash
    scheduledTasks = {};
  }
}

/**
 * Stop all scheduled email jobs
 */
export function stopEmailScheduler() {
  console.log('Stopping email scheduler...');
  
  // Stop all scheduled tasks
  Object.keys(scheduledTasks).forEach(key => {
    if (scheduledTasks[key]) {
      scheduledTasks[key].stop();
    }
  });
  
  // Clear the tasks object
  scheduledTasks = {};
}

/**
 * Send reports to all users with a specific frequency
 */
async function sendReportsForFrequency(frequency: 'daily' | 'weekly' | 'monthly') {
  try {
    // Get all users who have opted to receive reports with this frequency
    const usersWithFrequency = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.upcomingOrdersFrequency, frequency));
    
    console.log(`Found ${usersWithFrequency.length} users to send ${frequency} reports to`);
    
    // Send reports to each user
    for (const userSettings of usersWithFrequency) {
      if (userSettings.receiveUpcomingOrders) {
        await sendUpcomingOrdersReport(userSettings.userId);
      }
    }
  } catch (error) {
    console.error(`Error sending ${frequency} reports:`, error);
  }
}

/**
 * Send payment reminders to all applicable users
 */
async function sendAllPaymentReminders() {
  try {
    // Get all users who have opted to receive payment reminders
    const usersWithReminders = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.receivePaymentReminders, true));
    
    console.log(`Found ${usersWithReminders.length} users to send payment reminders to`);
    
    // Send payment reminders to each user
    for (const userSettings of usersWithReminders) {
      await sendPaymentReminders(userSettings.userId);
    }
  } catch (error) {
    console.error('Error sending payment reminders:', error);
  }
}