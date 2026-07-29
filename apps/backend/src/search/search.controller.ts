import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ElasticsearchService, SearchResult } from './elasticsearch.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuildsService } from '../guilds/guilds.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly esService: ElasticsearchService,
    private readonly guildsService: GuildsService,
  ) {}

  @Get('messages')
  async searchMessages(
    @CurrentUser() user: { userId: string },
    @Query('q') query: string,
    @Query('guildId') guildId: string,
    @Query('channelId') channelId?: string,
    @Query('authorId') authorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResult> {
    if (!guildId) {
      throw new BadRequestException('guildId is required');
    }

    await this.guildsService.assertMembership(guildId, user.userId);

    return this.esService.search({
      query,
      guildId,
      channelId,
      authorId,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
