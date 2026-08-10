import { Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchConsumer } from './search.consumer';
import { SearchController } from './search.controller';
import { GuildsModule } from '../guilds/guilds.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [GuildsModule, MessagesModule],
  providers: [ElasticsearchService],
  controllers: [SearchController, SearchConsumer],
  exports: [ElasticsearchService],
})
export class SearchModule {}
