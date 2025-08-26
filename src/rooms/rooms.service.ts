import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createRoomDto: CreateRoomDto) {
    const room = await this.prisma.room.create({
      data: {
        ...createRoomDto,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    await this.prisma.roomMember.create({
      data: {
        userId,
        roomId: room.id,
      },
    });

    return room;
  }

  async findAll() {
    return this.prisma.room.findMany({
      where: { isActive: true },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id, isActive: true },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async findByInviteCode(inviteCode: string) {
    const room = await this.prisma.room.findUnique({
      where: { inviteCode, isActive: true },
      include: {
        owner: {
          select: { id: true, username: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async joinRoom(userId: string, roomId: string, joinRoomDto?: JoinRoomDto) {
    const room = await this.findOne(roomId);

    const existingMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Already a member of this room');
    }

    if (room.autoJoin) {
      return this.prisma.roomMember.create({
        data: {
          userId,
          roomId,
        },
        include: {
          user: {
            select: { id: true, username: true },
          },
          room: {
            select: { id: true, name: true },
          },
        },
      });
    } else {
      const existingRequest = await this.prisma.joinRequest.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

      if (existingRequest) {
        throw new ConflictException('Join request already exists');
      }

      return this.prisma.joinRequest.create({
        data: {
          userId,
          roomId,
          message: joinRoomDto?.message,
        },
        include: {
          user: {
            select: { id: true, username: true },
          },
          room: {
            select: { id: true, name: true },
          },
        },
      });
    }
  }

  async approveJoinRequest(ownerId: string, requestId: string) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        room: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (request.room.ownerId !== ownerId) {
      throw new ForbiddenException('Only room owner can approve requests');
    }

    const [member] = await this.prisma.$transaction([
      this.prisma.roomMember.create({
        data: {
          userId: request.userId,
          roomId: request.roomId,
        },
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      }),
      this.prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      }),
    ]);

    return member;
  }

  async rejectJoinRequest(ownerId: string, requestId: string) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        room: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (request.room.ownerId !== ownerId) {
      throw new ForbiddenException('Only room owner can reject requests');
    }

    return this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  async getPendingRequests(ownerId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.joinRequest.findMany({
      where: {
        roomId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserRooms(userId: string) {
    return this.prisma.roomMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        room: {
          include: {
            owner: {
              select: { id: true, username: true },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }
}