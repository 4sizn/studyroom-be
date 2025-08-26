import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createMessageDto: CreateMessageDto) {
    const { roomId, content, type = 'TEXT' } = createMessageDto;

    const membership = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You are not a member of this room');
    }

    return this.prisma.message.create({
      data: {
        content,
        type,
        userId,
        roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async findByRoom(roomId: string, userId: string, limit = 50, offset = 0) {
    const membership = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You are not a member of this room');
    }

    return this.prisma.message.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}