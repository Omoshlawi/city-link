import { Global, Module } from '@nestjs/common';
import { QueryBuilderModule } from './query-builder';

@Global()
@Module({
  imports: [QueryBuilderModule],
  exports: [QueryBuilderModule],
})
export class CommonModule {}
