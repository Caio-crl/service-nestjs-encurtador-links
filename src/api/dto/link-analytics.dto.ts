import { ApiProperty } from '@nestjs/swagger';

export class LinkAnalyticsDto {
  @ApiProperty({ example: 'aB91xZ' })
  slug: string;

  @ApiProperty({ example: 'https://example.com/page' })
  originalUrl: string;

  @ApiProperty({ type: Number, example: 42, minimum: 0 })
  totalClicks: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastClickAt: Date | null;
}
