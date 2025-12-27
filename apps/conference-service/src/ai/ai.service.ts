// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAuditLog } from './ai-audit.entity';
import * as crypto from 'crypto';

export interface KeywordSuggestionResponse {
  score: number;
  reason: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiAuditLog)
    private aiAuditRepo: Repository<AiAuditLog>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in .env');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private async logAudit(
    feature: string,
    conferenceId: string | null = null,
    submissionId: string | null = null,
    userId: number | null = null,
    input: string,
    output: string,
  ) {
    try {
      const inputHash = crypto.createHash('sha256').update(input).digest('hex');
      const outputPreview = output.slice(0, 500);

      const entityData: Partial<AiAuditLog> = {
        model: 'gpt-4o-mini',
        feature,
        // Chuyển null → undefined để khớp với kiểu ? trong entity
        conferenceId: conferenceId ?? undefined,
        submissionId: submissionId ?? undefined,
        userId: userId ?? undefined,
        inputHash,
        outputPreview,
      };

      const log = this.aiAuditRepo.create(entityData);
      await this.aiAuditRepo.save(log);
    } catch (error) {
      console.error('Failed to save AI audit log:', error);
    }
  }

  async generateEmailDraft(
    prompt: string,
    conferenceId: string | null = null,
    userId: number | null = null,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý soạn email chuyên nghiệp cho hội nghị khoa học. Viết ngắn gọn, lịch sự, bằng tiếng Việt hoặc tiếng Anh tùy prompt.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';

      await this.logAudit('email_draft', conferenceId, null, userId, prompt, content);

      return content;
    } catch (error) {
      console.error('Email draft generation error:', error);
      return 'Failed to generate email draft due to AI service error.';
    }
  }

  async suggestKeywords(
    abstract: string,
    submissionId: string | null = null,
    userId: number | null = null,
  ): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Trích xuất tối đa 8 từ khóa khoa học quan trọng nhất từ abstract sau, trả về dưới dạng JSON: {"keywords": ["kw1", "kw2", ...]}',
          },
          { role: 'user', content: abstract },
        ],
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content?.trim() || '{}';
      let keywords: string[] = [];

      try {
        const parsed = JSON.parse(raw);
        keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      } catch {
        keywords = [];
      }

      await this.logAudit('keyword_suggestion', null, submissionId, userId, abstract, JSON.stringify(keywords));

      return keywords;
    } catch (error) {
      console.error('Keyword suggestion error:', error);
      return [];
    }
  }

  async generateNeutralSummary(
    abstract: string,
    submissionId: string | null = null,
    userId: number | null = null,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Tạo tóm tắt trung lập 150–250 từ từ abstract, không tiết lộ bất kỳ thông tin nào về tác giả hoặc tổ chức.',
          },
          { role: 'user', content: abstract },
        ],
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';

      await this.logAudit('neutral_summary', null, submissionId, userId, abstract, content);

      return content;
    } catch (error) {
      console.error('Neutral summary error:', error);
      return 'Failed to generate neutral summary.';
    }
  }

  async generateKeywordSuggestion(
    prompt: string,
    conferenceId: string | null = null,
    userId: number | null = null,
  ): Promise<KeywordSuggestionResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        parsed = {};
      }

      const score = Math.max(0, Math.min(10, Number(parsed.score ?? 0)));
      const reason = typeof parsed.reason === 'string' ? parsed.reason : 'No reason provided by AI';

      await this.logAudit(
        'keyword_similarity',
        conferenceId,
        null,
        userId,
        prompt,
        JSON.stringify({ score, reason }),
      );

      return { score, reason };
    } catch (error) {
      console.error('AI keyword suggestion error:', error);

      await this.logAudit(
        'keyword_similarity_error',
        conferenceId,
        null,
        userId,
        prompt,
        error instanceof Error ? error.message : 'Unknown error',
      );

      return { score: 0, reason: 'AI service temporarily unavailable' };
    }
  }
}