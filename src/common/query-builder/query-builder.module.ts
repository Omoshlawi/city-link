import { Module } from '@nestjs/common';
import { PaginationService } from './pagination.service';
import { CustomRepresentationService } from './representation.service';
import { SortService } from './sort.service';

@Module({
  providers: [PaginationService, CustomRepresentationService, SortService],
  exports: [PaginationService, CustomRepresentationService, SortService],
})
export class QueryBuilderModule {}
