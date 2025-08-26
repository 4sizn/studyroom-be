import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, string>();

  constructor(
    private messagesService: MessagesService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      this.userSockets.set(user.id, client.id);

      await this.usersService.updateUserStatus(user.id, 'ONLINE');

      this.logger.log(`User ${user.username} connected`);
      
      client.broadcast.emit('userStatusChanged', {
        userId: user.id,
        username: user.username,
        status: 'ONLINE',
      });

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user) {
      const user = client.data.user;
      this.userSockets.delete(user.id);

      await this.usersService.updateUserStatus(user.id, 'OFFLINE');

      this.logger.log(`User ${user.username} disconnected`);
      
      client.broadcast.emit('userStatusChanged', {
        userId: user.id,
        username: user.username,
        status: 'OFFLINE',
      });
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      await client.join(data.roomId);
      
      client.to(data.roomId).emit('userJoined', {
        userId: user.id,
        username: user.username,
        roomId: data.roomId,
      });

      this.logger.log(`User ${user.username} joined room ${data.roomId}`);
    } catch (error) {
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    await client.leave(data.roomId);
    
    client.to(data.roomId).emit('userLeft', {
      userId: user.id,
      username: user.username,
      roomId: data.roomId,
    });

    this.logger.log(`User ${user.username} left room ${data.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      const message = await this.messagesService.create(user.id, createMessageDto);
      
      this.server.to(createMessageDto.roomId).emit('newMessage', message);
      
      this.logger.log(`Message sent by ${user.username} in room ${createMessageDto.roomId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    if (!user) return;

    client.to(data.roomId).emit('userTyping', {
      userId: user.id,
      username: user.username,
      isTyping: data.isTyping,
    });
  }
}