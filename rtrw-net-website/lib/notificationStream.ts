// lib/notificationStream.ts
import { EventEmitter } from "events";

// Gunakan global variable agar tidak reset saat hot-reload di development
declare global {
  var notificationEmitter: EventEmitter | undefined;
}

export const notificationEmitter =
  global.notificationEmitter || new EventEmitter();

// Set max listeners lebih tinggi dari default (10) agar tidak error saat banyak admin login
notificationEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  global.notificationEmitter = notificationEmitter;
}

export const NOTIFICATION_EVENT = "payment_notification";
