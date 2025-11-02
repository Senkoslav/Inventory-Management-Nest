import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('search')
  search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.searchService.search(query, limit);
  }

  @Public()
  @Get('tags')
  getTags(@Query('prefix') prefix?: string, @Query('limit') limit?: number) {
    return this.searchService.getTags(prefix, limit);
  }
}
