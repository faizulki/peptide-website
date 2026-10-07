import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

function slugify(text: string): string {
  return text
    // Strip accents so Swedish titles keep their letters (å/ä → a, ö → o)
    // instead of losing them, e.g. "Jämförelse" → "jamforelse".
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// Soro (or any other integration) may name its fields differently than we
// guessed before ever seeing a real payload — try the common variants and
// fall back gracefully rather than rejecting the webhook.
function pick(payload: any, keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof payload?.[key] === 'string' && payload[key].trim()) {
      return payload[key];
    }
  }
  return undefined;
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,
  ) {}

  async findAllPublished(): Promise<Article[]> {
    return this.articlesRepository.find({
      where: { isPublished: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForAdmin(): Promise<Article[]> {
    return this.articlesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findBySlug(slug: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { slug, isPublished: true },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  private async uniqueSlug(base: string, ignoreId?: string): Promise<string> {
    const root = base || 'article';
    let slug = root;
    let suffix = 1;
    while (true) {
      const existing = await this.articlesRepository.findOne({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      suffix += 1;
      slug = `${root}-${suffix}`;
    }
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    // Articles may be written only in Swedish, so fall back to that title.
    const slug = await this.uniqueSlug(
      slugify(dto.slug || dto.title || dto.titleSv || ''),
    );
    const article = this.articlesRepository.create({
      title: dto.title,
      titleSv: dto.titleSv,
      slug,
      content: dto.content,
      contentSv: dto.contentSv,
      metaDescription: dto.metaDescription,
      metaDescriptionSv: dto.metaDescriptionSv,
      featuredImage: dto.featuredImage,
      isPublished: dto.isPublished ?? true,
      source: 'manual',
    });
    return this.articlesRepository.save(article);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.findOne(id);
    const { slug, ...fields } = dto;
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        (article as any)[key] = value;
      }
    }
    // A blank slug means "create it from the title" (never store it empty).
    if (slug !== undefined) {
      const source = slug.trim() || article.title || article.titleSv || '';
      article.slug = await this.uniqueSlug(slugify(source), id);
    }
    return this.articlesRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articlesRepository.remove(article);
  }

  // Called from the unauthenticated (secret-protected) webhook route. The
  // exact payload shape from Soro is unknown until a real account is
  // connected, so this parses leniently across likely key names and always
  // keeps the raw body so mapping can be fixed up later without data loss.
  async createFromWebhook(payload: any): Promise<Article> {
    const title = pick(payload, ['title', 'headline', 'name']) || 'Untitled article';
    const content =
      pick(payload, ['content', 'body', 'html', 'article_html', 'articleHtml']) || '';
    const metaDescription = pick(payload, [
      'metaDescription',
      'meta_description',
      'excerpt',
      'description',
      'summary',
    ]);
    const featuredImage = pick(payload, [
      'featuredImage',
      'featured_image',
      'image',
      'cover_image',
      'coverImage',
      'image_url',
      'imageUrl',
    ]);
    const requestedSlug = pick(payload, ['slug', 'url_slug', 'urlSlug']);

    const rawPayload = JSON.stringify(payload);

    // If Soro re-sends/updates the same article (matched by its own slug),
    // update it in place instead of creating a duplicate.
    if (requestedSlug) {
      const existing = await this.articlesRepository.findOne({
        where: { slug: slugify(requestedSlug), source: 'soro' },
      });
      if (existing) {
        existing.title = title;
        existing.content = content;
        if (metaDescription !== undefined) existing.metaDescription = metaDescription;
        if (featuredImage !== undefined) existing.featuredImage = featuredImage;
        existing.rawPayload = rawPayload;
        return this.articlesRepository.save(existing);
      }
    }

    const slug = await this.uniqueSlug(slugify(requestedSlug || title));
    const article = this.articlesRepository.create({
      title,
      slug,
      content,
      metaDescription,
      featuredImage,
      isPublished: true,
      source: 'soro',
      rawPayload,
    });
    return this.articlesRepository.save(article);
  }
}
