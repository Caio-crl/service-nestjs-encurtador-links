import { IsString, Matches } from 'class-validator';

export class ResolveSlugParamsDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9]{6}$/)
  slug: string;
}
