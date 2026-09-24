import { ApiProperty } from '@nestjs/swagger';

export class CreatedLinkDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'https://example.com/page' })
  originalUrl: string;

  @ApiProperty({ example: 'aB91xZ' })
  slug: string;

  @ApiProperty({ example: 'https://short.example/aB91xZ' })
  shortUrl: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
