import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Headers,
  Query,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll() {
    return this.articlesService.findAllPublished();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAllForAdmin() {
    return this.articlesService.findAllForAdmin();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    await this.articlesService.remove(id);
    return { message: 'Article deleted successfully' };
  }

  // Called by Soro SEO (or any other third-party publisher) — not a logged-in
  // admin, so it's authenticated with a shared secret instead of a JWT.
  // Soro's exact webhook config UI is unknown until the client connects a
  // real account, so the secret is accepted via either a header or a query
  // param, whichever the tool ends up supporting.
  @Post('webhook/soro')
  @HttpCode(HttpStatus.OK)
  async handleSoroWebhook(
    @Body() payload: any,
    @Headers('x-webhook-secret') headerSecret: string,
    @Query('secret') querySecret: string,
  ) {
    const expected = this.configService.get<string>('ARTICLES_WEBHOOK_SECRET');
    const provided = headerSecret || querySecret;
    if (!expected || provided !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const article = await this.articlesService.createFromWebhook(payload);
    return { received: true, id: article.id, slug: article.slug };
  }
}
