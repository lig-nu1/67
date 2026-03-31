import cron from 'node-cron';

// Only run in Node.js runtime (not Edge)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Prevent multiple cron instances during hot-reloading in dev
  const globalAny: any = global;
  if (!globalAny.cronStarted) {
    globalAny.cronStarted = true;
    
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Running AI Manager check...');
      
      try {
        // We trigger the generic API endpoint we created because DB functions run nicely there
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/cron/notify`, {
          method: 'POST',
        });
        const data = await res.json();
        console.log(`[CRON] Complete. Notified: ${data.notified || 0} volunteers.`);
      } catch (err: any) {
        console.error('[CRON] Error:', err.message);
      }
    });

    console.log('[CRON] Background Manager initialized');
  }
}
