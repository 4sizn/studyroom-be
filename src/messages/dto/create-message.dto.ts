import { IsString, IsEnum, IsOptional } from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsString()
  roomId: string;
}