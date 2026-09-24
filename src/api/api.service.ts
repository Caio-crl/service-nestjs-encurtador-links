import { Injectable } from '@nestjs/common';
import { AppService } from '../common/app.service';
import { CreatedLinkDto } from './dto/created-link.dto';

@Injectable()
export class ApiService {
  constructor(private readonly appService: AppService) {}

  getHealthCheck() {
    return this.appService.getHealthCheck();
  }

  createLink(url: string): Promise<CreatedLinkDto> {
    return this.appService.createLink(url);
  }
}
