import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com/page' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  url: string;
}
