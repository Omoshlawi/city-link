export const QUEUE_NAMES = {
  EMAIL: 'notification-email',
  PUSH: 'notification-push',
  SMS: 'notification-sms',
} as const;

export const NOTIFICATION_PROVIDERS = {
  EXPO: 'expo',
  SENDGRID: 'sendgrid',
  SMTP: 'smtp',
  TWILIO: 'twilio',
  AFRICAS_TALKING: 'africas_talking',
  STUB: 'stub',
} as const;

export enum NotificationPriority {
  HIGH = 1, // auth events, OTPs, security alerts
  NORMAL = 5, // general notifications
  LOW = 10, // digests, marketing
}
