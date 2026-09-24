import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiFoundResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiService } from './api.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { CreatedLinkDto } from './dto/created-link.dto';
import { ResolveSlugParamsDto } from './dto/resolve-slug-params.dto';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/health')
  healthCheck() {
    return this.apiService.getHealthCheck();
  }

  @Post('/links')
  @ApiOperation({ summary: 'Cria um link curto para uma URL HTTP(S)' })
  @ApiBody({ type: CreateLinkDto })
  @ApiCreatedResponse({ description: 'Link criado', type: CreatedLinkDto })
  @ApiBadRequestResponse({ description: 'URL inválida ou campo não permitido' })
  createLink(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateLinkDto,
  ): Promise<CreatedLinkDto> {
    return this.apiService.createLink(body.url);
  }

  @Get('/:slug')
  @Redirect(undefined, 302)
  @ApiOperation({ summary: 'Redireciona um link curto e registra o clique' })
  @ApiParam({
    name: 'slug',
    description: 'Slug alfanumérico de seis caracteres',
    example: 'aB91xZ',
  })
  @ApiFoundResponse({
    description: 'Redireciona para a URL original',
    headers: {
      Location: { description: 'URL original', schema: { type: 'string' } },
    },
  })
  @ApiBadRequestResponse({ description: 'Slug inválido' })
  @ApiNotFoundResponse({ description: 'Link não encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Falha ao resolver o link' })
  async redirectToLink(
    @Param(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    params: ResolveSlugParamsDto,
  ): Promise<{ url: string }> {
    return { url: await this.apiService.resolveLink(params.slug) };
  }
}
