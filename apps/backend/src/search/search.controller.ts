import {
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ElasticsearchService } from './elasticsearch.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuildsService } from '../guilds/guilds.service';
import { MessagesService } from '../messages/messages.service';

interface JwtPayload {
  userId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  private readonly logger = new Logger('SearchController');

  constructor(
    private readonly esService: ElasticsearchService,
    private readonly guildsService: GuildsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get('messages')
  async searchMessages(
    @CurrentUser() user: JwtPayload,
    @Query('q') query: string,
    @Query('guildId') guildId: string,
    @Query('channelId') channelId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(
      `Search request: q="${query}" guildId="${guildId}" userId="${user.userId}"`,
    );

    if (!guildId) {
      return { hits: [], total: 0 };
    }

    await this.guildsService.assertMembership(guildId, user.userId);

    const result = await this.esService.search({
      query: query ?? '',
      guildId,
      channelId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    this.logger.log(`Search result: ${result.total} total hits`);
    return result;
  }

  @Post('reindex')
  async reindex(@CurrentUser() user: JwtPayload) {
    this.logger.log(`Reindex triggered by user: ${user.userId}`);

    const messages = await this.messagesService.findAllWithGuild();
    this.logger.log(`Found ${messages.length} messages to index`);

    let indexed = 0;
    let failed = 0;

    for (const msg of messages) {
      try {
        await this.esService.indexMessage({
          messageId: msg.id,
          content: msg.content,
          channelId: msg.channelId,
          guildId: msg.channel?.guildId ?? '',
          authorId: msg.authorId,
          createdAt: msg.createdAt.toISOString(),
        });
        indexed++;
      } catch {
        failed++;
      }
    }

    return { indexed, failed, total: messages.length };
  }
}