import {
  Controller,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { EventsGateway } from '../events/events.gateway';

interface JwtPayload {
  userId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Patch(':id')
  async edit(
    @Param('id') messageId: string,
    @Body('content') content: string,
    @Body('guildId') guildId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.messagesService.edit(messageId, user.userId, content);

    if (guildId) {
      this.eventsGateway.emitToGuild(guildId, 'message:update', {
        id: messageId,
        content,
        editedAt: new Date().toISOString(),
      });
    }
    return { ok: true };
  }

  @Delete(':id')
  async delete(
    @Param('id') messageId: string,
    @Body('guildId') guildId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.messagesService.softDelete(messageId, user.userId);

    if (guildId) {
      this.eventsGateway.emitToGuild(guildId, 'message:delete', {
        id: messageId,
      });
    }
    return { ok: true };
  }
}
