import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(user.id, createRoomDto);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('my-rooms')
  getUserRooms(@CurrentUser() user: any) {
    return this.roomsService.getUserRooms(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Get('invite/:inviteCode')
  findByInviteCode(@Param('inviteCode') inviteCode: string) {
    return this.roomsService.findByInviteCode(inviteCode);
  }

  @Post(':id/join')
  joinRoom(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() joinRoomDto: JoinRoomDto,
  ) {
    return this.roomsService.joinRoom(user.id, id, joinRoomDto);
  }

  @Get(':id/requests')
  getPendingRequests(@CurrentUser() user: any, @Param('id') id: string) {
    return this.roomsService.getPendingRequests(user.id, id);
  }

  @Patch('requests/:requestId/approve')
  approveJoinRequest(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string,
  ) {
    return this.roomsService.approveJoinRequest(user.id, requestId);
  }

  @Patch('requests/:requestId/reject')
  rejectJoinRequest(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string,
  ) {
    return this.roomsService.rejectJoinRequest(user.id, requestId);
  }
}