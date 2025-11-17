import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  async uploadImage(@Body() body: { image: string; folder?: string }) {
    const { image, folder = 'general' } = body;
    return this.filesService.uploadBase64Image(image, 'upload', folder);
  }

  @Post('upload-multiple')
  async uploadMultiple(@Body() body: { images: string[]; folder?: string }) {
    const { images, folder = 'general' } = body;
    return this.filesService.uploadMultipleImages(images, folder);
  }

  @Get('auth')
  getAuthParams() {
    return this.filesService.getAuthenticationParameters();
  }
}
