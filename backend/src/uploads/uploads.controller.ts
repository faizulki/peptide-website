import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || join(process.cwd(), 'data', 'uploads');

mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('uploads')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UploadsController {
  constructor(private configService: ConfigService) {}

  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException('Only JPEG, PNG, WEBP, or GIF images are allowed'), false);
          return;
        }
        cb(null, true);
      },
      // 10 MB: lab report scans are often larger than product photos.
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    return { url: `${appUrl}/uploads/${file.filename}` };
  }
}
