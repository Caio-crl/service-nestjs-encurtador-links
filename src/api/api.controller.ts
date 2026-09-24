import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiService } from './api.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { CreatedLinkDto } from './dto/created-link.dto';

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
}
