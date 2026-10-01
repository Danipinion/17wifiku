// lib/gotify.ts

const GOTIFY_URL = process.env.GOTIFY_URL || "http://10.0.0.102:8081";

// Individual Application Tokens (Put these in your .env)
const TOKENS = {
  BILLING: process.env.GOTIFY_BILLING_TOKEN || "", // Billing & Pembayaran
  SYSTEM: process.env.GOTIFY_SYSTEM_TOKEN || "",   // Alarm & Sistem
  PROMO: process.env.GOTIFY_PROMO_TOKEN || "",     // Promo & Info
};

type GotifyApp = keyof typeof TOKENS;

interface GotifyMessage {
  title: string;
  message: string;
  priority?: number; // 0-10
  extras?: Record<string, any>;
}

/**
 * Send a notification via Gotify
 */
export async function sendGotifyNotification(
  app: GotifyApp,
  { title, message, priority = 5, extras = {} }: GotifyMessage
) {
  const token = TOKENS[app];
  
  if (!token) {
    console.warn(`[Gotify] No token found for app: ${app}. skipping...`);
    return;
  }

  try {
    const response = await fetch(`${GOTIFY_URL}/message?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        message,
        priority,
        extras,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Gotify] Failed to send notification: ${errText}`);
    } else {
      const data = await response.json();
      console.log(`[Gotify] Notification sent successfully to ${app}. Message ID: ${data.id}`);
    }
  } catch (error) {
    console.error(`[Gotify] Error sending notification to ${app}:`, error);
  }
}

/**
 * Helper for Broadcasting to all customers (Promo & Info)
 */
export async function broadcastPromo(title: string, message: string) {
  return sendGotifyNotification("PROMO", {
    title,
    message,
    priority: 7, 
    extras: {
      "client::display": { contentType: "text/markdown" },
      "android::notification": { click: { url: "sobatwiff://notifications" } }
    }
  });
}

/**
 * Helper for Personal Billing notification
 */
export async function sendBillingSuccess(userId: string, title: string, message: string) {
  // To target a specific user in Gotify while using a shared set of applications,
  // we either need separate accounts OR we include the userId in the metadata
  // so the client app can filter it.
  return sendGotifyNotification("BILLING", {
    title,
    message,
    priority: 8,
    extras: {
      userId, // Crucial for client-side filtering
      "android::notification": { click: { url: `sobatwiff://billing/${userId}` } }
    }
  });
}

/**
 * Helper for System Alarms
 */
export async function sendSystemAlarm(title: string, message: string) {
  return sendGotifyNotification("SYSTEM", {
    title,
    message,
    priority: 10, // Urgent
  });
}
