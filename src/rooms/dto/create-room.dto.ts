import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  autoJoin?: boolean;
}