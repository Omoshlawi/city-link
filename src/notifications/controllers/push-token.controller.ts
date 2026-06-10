import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../../common/common.decorators';
import type { UserSession } from '../../auth/auth.types';
import { RegisterPushTokenDto } from '../dto/notifications.dto';
import { PushTokenService } from '../push-token.service';

@ApiTags('Notifications')
@Controller('notifications/push-tokens')
export class PushTokenController {
  constructor(private readonly pushTokenService: PushTokenService) {}

  @Post('/')
  @ApiOperation({ summary: 'Register a push token for the authenticated user' })
  @ApiErrorsResponse({ badRequest: true })
  register(@Body() dto: RegisterPushTokenDto, @Session() { user }: UserSession) {
    return this.pushTokenService.register(
      user.id,
      dto.token,
      dto.provider,
      dto.platform,
      dto.deviceId,
    );
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Void (deregister) a push token' })
  @ApiErrorsResponse()
  void(@Param('id', ParseUUIDPipe) id: string, @Session() { user }: UserSession) {
    return this.pushTokenService.void(id, user.id);
  }
}
