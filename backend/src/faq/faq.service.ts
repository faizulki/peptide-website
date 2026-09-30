import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from '../entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,
  ) {}

  async findAll(includeInactive = false): Promise<Faq[]> {
    return this.faqRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Faq> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async create(dto: CreateFaqDto): Promise<Faq> {
    const faq = this.faqRepository.create({
      question: dto.question,
      answer: dto.answer,
      questionSv: dto.questionSv,
      answerSv: dto.answerSv,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.faqRepository.save(faq);
  }

  async update(id: string, dto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.findOne(id);
    // Only apply fields actually present in the request — a blind
    // Object.assign would overwrite untouched fields with `undefined` for
    // any key the DTO declares but the caller omitted.
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        (faq as any)[key] = value;
      }
    }
    return this.faqRepository.save(faq);
  }

  async remove(id: string): Promise<void> {
    const faq = await this.findOne(id);
    await this.faqRepository.remove(faq);
  }
}
