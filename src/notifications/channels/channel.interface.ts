export interface ISmsChannel {
  send(
    to: string,
    message: string,
  ): Promise<{ messageId?: string; raw?: unknown }>;
}

export const SMS_CHANNEL = Symbol('ISmsChannel');
