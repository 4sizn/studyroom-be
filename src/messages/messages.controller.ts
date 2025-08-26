import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('room/:roomId')
  findByRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    return this.messagesService.findByRoom(roomId, user.id, limit, offset);
  }
}