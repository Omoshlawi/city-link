import { Global, Module } from '@nestjs/common';
import { QueryBuilderModule } from './query-builder';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodValidationExceptionFilter } from './common.exceptionfilters';

@Global()
@Module({
  imports: [QueryBuilderModule],
  exports: [QueryBuilderModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationExceptionFilter,
    },
  ],
})
export class CommonModule {}
