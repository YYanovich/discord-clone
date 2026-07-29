import {
  Controller, Delete, Patch, Param, Body, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

interface JwtPayload {
  userId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Patch(':id')
  edit(
    @Param('id') messageId: string,
    @Body('content') content: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.edit(messageId, user.userId, content);
  }

  @Delete(':id')
  delete(
    @Param('id') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.softDelete(messageId, user.userId);
  }
}