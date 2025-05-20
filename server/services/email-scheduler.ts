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
  
  // Daily at 7am - Upcoming orders for users with daily frequency
  scheduledTasks['dailyReports'] = cron.schedule('0 7 * * *', async () => {
    console.log('Running daily order reports job');
    await sendReportsForFrequency('daily');
  });
  
  // Every Monday at 7am - Weekly upcoming orders
  scheduledTasks['weeklyReports'] = cron.schedule('0 7 * * 1', async () => {
    console.log('Running weekly order reports job');
    await sendReportsForFrequency('weekly');
  });
  
  // 1st of the month at 7am - Monthly upcoming orders
  scheduledTasks['monthlyReports'] = cron.schedule('0 7 1 * *', async () => {
    console.log('Running monthly order reports job');
    await sendReportsForFrequency('monthly');
  });
  
  // Daily at 10am - Payment reminders
  scheduledTasks['paymentReminders'] = cron.schedule('0 10 * * *', async () => {
    console.log('Running payment reminders job');
    await sendAllPaymentReminders();
  });
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