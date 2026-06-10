import { DynamicModule, Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule as AuthenticationModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin,
  anonymous,
  bearer,
  jwt,
  openAPI,
  organization,
  phoneNumber,
  twoFactor,
  username,
} from 'better-auth/plugins';
import { AppConfig } from '../app.config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDispatchService } from '../notifications/dispatch.service';
import { NotificationPriority } from '../notifications/notifications.constants';
import { AuthConfig } from './auth.config';
import { RequireActiveOrganizationGuard } from './auth.guards';
import { adminConfig } from './auth.system.acl';
import { UserSession } from './auth.types';
import { organizationConfig } from './auth.org.acl';
import { ExtendedAuthController } from './auth.controller';
import { ExtendedAuthService } from './auth.service';
import { AuthHook } from './auth.hooks';

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
      providers: [...this.globalProviders, ExtendedAuthService, AuthHook],
      global: true,
      imports: [authModule],
      exports: [authModule],
      controllers: [ExtendedAuthController],
    };
  }

  static getBetterAuthModule() {
    return AuthenticationModule.forRootAsync({
      useFactory: (
        prisma: PrismaService,
        appConfig: AppConfig,
        authConfig: AuthConfig,
        notificationDispatch: NotificationDispatchService,
      ) => ({
        auth: betterAuth({
          database: prismaAdapter(prisma, {
            provider: 'postgresql',
          }),
          user: {
            changeEmail: {
              enabled: true,
              sendChangeEmailVerification: async (
                {
                  user,
                  newEmail,
                  token,
                }: {
                  user: UserSession['user'];
                  newEmail: string;
                  token: string;
                },
                _,
              ) => {
                const deepLink = `citylinkapp://change-email-verify?token=${token}`;
                const actionUrl = `${appConfig.frontEndUrl}/auth/change-email-verify?token=${token}`;
                const year = new Date().getFullYear();
                // 1. Verification email → new address (proves ownership)
                await notificationDispatch.sendFromTemplate({
                  templateKey: 'auth.email.change',
                  recipient: { userId: user.id, email: newEmail },
                  data: { user, newEmail, actionUrl, deepLink, year },
                  priority: NotificationPriority.HIGH,
                  force: true,
                  internalNote: `Email change verification to ${newEmail} for user ${user.id}`,
                });
                // 2. Security alert → old address (notifies the account owner)
                await notificationDispatch.sendFromTemplate({
                  templateKey: 'auth.email.change.alert',
                  recipient: { userId: user.id, email: user.email },
                  data: { user, newEmail, year },
                  priority: NotificationPriority.HIGH,
                  force: true,
                  internalNote: `Email change security alert to ${user.email} — new address: ${newEmail}`,
                });
              },
            },
          },
          plugins: [
            username(),
            anonymous(),
            admin(adminConfig),
            organization(organizationConfig),
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
          advanced: { disableOriginCheck: true },
          emailAndPassword: {
            enabled: true,
            sendResetPassword: async ({ user, token }, _) => {
              const deepLink = `citylinkapp://auth/reset-password?token=${token}`;
              const actionUrl = `${appConfig.frontEndUrl}/auth/reset-password?token=${token}`;
              await notificationDispatch.sendFromTemplate({
                templateKey: 'auth.password.reset',
                recipient: { userId: user.id, email: user.email },
                data: {
                  user,
                  actionUrl,
                  deepLink,
                  year: new Date().getFullYear(),
                },
                priority: NotificationPriority.HIGH,
                force: true,
                internalNote: `Password reset requested for ${user.email}`,
              });
            },
            requireEmailVerification: true,
          },
          emailVerification: {
            sendVerificationEmail: async ({ user, token }, _) => {
              const deepLink = `citylinkapp://auth/verify-email?token=${token}`;
              const actionUrl = `${appConfig.frontEndUrl}/auth/verify-email?token=${token}`;
              await notificationDispatch.sendFromTemplate({
                templateKey: 'auth.email.verification',
                recipient: { userId: user.id, email: user.email },
                data: {
                  user,
                  actionUrl,
                  deepLink,
                  year: new Date().getFullYear(),
                },
                priority: NotificationPriority.HIGH,
                force: true,
                internalNote: `Email verification for new user ${user.email}`,
              });
            },
            autoSignInAfterVerification: true,
            sendOnSignUp: true,
            sendOnSignIn: true,
          },
          hooks: {},
        }),
      }),
      inject: [
        PrismaService,
        AppConfig,
        AuthConfig,
        NotificationDispatchService,
      ],
    });
  }
}
