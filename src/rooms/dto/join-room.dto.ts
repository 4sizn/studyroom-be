import { IsString, IsOptional } from 'class-validator';

export class JoinRoomDto {
  @IsOptional()
  @IsString()
  message?: string;
}