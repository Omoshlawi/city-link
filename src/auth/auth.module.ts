import { DynamicModule, Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule as AuthenticationModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { AppConfig } from '../app.config';
import { PrismaService } from '../prisma/prisma.service';
import { RequireActiveOrganizationGuard } from './auth.guards';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { UserSession } from './auth.types';
import {
  admin,
  anonymous,
  bearer,
  jwt,
  openAPI,
  phoneNumber,
  twoFactor,
  username,
} from 'better-auth/plugins';
import { adminConfig } from './auth.system.acl';
import { AuthConfig } from './auth.config';

@Module({})
export class AuthModule {
  static logger = new Logger(AuthModule.name);
  static globalProviders = [
    { provide: APP_GUARD, useClass: RequireActiveOrganizationGuard },
  ];
  static forRoot(): DynamicModule {
    const authModule = this.getBetterAuthModule();
    return {
      module: AuthModule,
      providers: this.globalProviders,
      global: true,
      imports: [authModule],
      exports: [authModule],
    };
  }

  static getBetterAuthModule() {
    return AuthenticationModule.forRootAsync({
      useFactory: (
        prisma: PrismaService,
        appConfig: AppConfig,
        authConfig: AuthConfig,
      ) => ({
        auth: betterAuth({
          database: prismaAdapter(prisma, {
            provider: 'postgresql',
          }),
          user: {
            changeEmail: {
              enabled: true,
              sendChangeEmailVerification: (
                {
                  user,
                  newEmail,
                  token,
                }: {
                  user: UserSession['user'];
                  newEmail: string;
                  token: string;
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                _,
              ) => {
                const deepLink = `citylinkapp://change-email-verify?token=${token}`;
                const verificationUrl = `${appConfig.frontEndUrl}/change-email-verify?token=${token}`;
                const year = new Date().getFullYear();
                this.logger.log(
                  `Initiating email change process for user ${user.email} (id: ${user.id}) to new address ${newEmail}.`,
                );
                this.logger.debug(
                  `Generated verification token for email change: ${token}. Deep link: ${deepLink}, Verification URL: ${verificationUrl}, Year: ${year}`,
                );
                // 1. Verification email → new address (proves ownership)
                /*
                await notificationDispatch.sendFromTemplate({
                  templateKey: 'auth.email.change',
                  recipient: { email: newEmail },
                  data: { user, newEmail, deepLink, verificationUrl, year },
                  userId: user.id,
                  priority: NotificationPriority.HIGH,
                  force: true,
                  eventTitle: 'Email Change Requested',
                  eventBody: `A verification email has been sent to ${newEmail} to confirm the email address change.`,
                  eventDescription: `Email change requested by user ${user.email} (id: ${user.id}) to new address ${newEmail}.`,
                });
                */
                // 2. Security alert → old address (notifies the account owner)
                /*
                await notificationDispatch.sendFromTemplate({
                  templateKey: 'auth.email.change.alert',
                  recipient: { email: user.email },
                  data: { user, newEmail, year },
                  userId: user.id,
                  priority: NotificationPriority.HIGH,
                  force: true,
                  eventTitle: 'Email Change Security Alert',
                  eventBody: `A security notice has been sent to ${user.email} regarding the email address change request.`,
                  eventDescription: `Security alert sent to old address ${user.email} for email change to ${newEmail} (user id: ${user.id}).`,
                });
                */
              },
            },
          },
          plugins: [
            username(),
            anonymous(),
            admin(adminConfig),
            bearer(),
            openAPI(),
            jwt(),
            twoFactor({
              otpOptions: {
                sendOTP: ({ user, otp }, request) => {
                  this.logger.log(
                    `Sending 2FA OTP for user ${user.email} (id: ${user.id}). OTP: ${otp}`,
                  );
                  this.logger.debug(
                    `2FA OTP details - User: ${JSON.stringify(
                      user,
                    )}, OTP: ${otp}, Request: ${JSON.stringify(request)}`,
                  );

                  /*
                  await notificationDispatch.sendFromTemplate({
                    templateKey: 'mock.sms.otp.sign_up',
                    recipient: { email: `mock.otpsigninsms@${authConfig.temporaryEmailDomain}` },
                    data: {
                      phoneNumber: (user as any).phoneNumber ?? user?.email,
                      code: otp,
                    },
                    userId: user?.id ?? '',
                    priority: NotificationPriority.HIGH,
                    force: true,
                    eventTitle: '2FA OTP',
                    eventBody: `OTP Has been sent to email addresed to your number.Use it FOR 2FA`,
                    eventDescription: `Sent when user IS DEALING WITH 2FA`,
                  });
                  */
                },
              },
            }),
            phoneNumber({
              sendOTP: ({ phoneNumber, code }, ctx) => {
                this.logger.log(
                  `Sending phone number verification OTP. Phone: ${phoneNumber}, Code: ${code}`,
                );
                this.logger.debug(
                  `Phone number OTP details - Phone: ${phoneNumber}, Code: ${code}, Context: ${JSON.stringify(
                    ctx,
                  )}`,
                );
                // wHEN SIGNING IN WITH OTP,USER DONT EXIST HENCE CANT USE NOTIFICATION DISPATCH AS IT REQUIRES USER ID HENCE MUST SEND MANNUALLY
                /*
                const {
                  slots: { email_subject, email_body },
                } = await templateService.renderAll('mock.sms.otp.sign_up', {
                  data: { phoneNumber, code },
                });
                await emailChannelService.send({
                  to: `mock.otpsigninsms@${authconfig.temporaryEmailDomain}`,
                  subject: email_subject,
                  html: email_body,
                });
                */
              },
              // Optional: Auto-create user on verification
              signUpOnVerification: {
                getTempEmail(phoneNumber) {
                  return `${phoneNumber}@${authConfig.temporaryEmailDomain}`;
                },
                getTempName(phoneNumber) {
                  return `${phoneNumber}@${authConfig.temporaryEmailDomain}`;
                },
              },
            }),
          ],
        }),
      }),
      inject: [PrismaService, AppConfig, AuthConfig],
    });
  }
}
