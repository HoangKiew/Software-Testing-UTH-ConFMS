import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, EmailTemplateType } from './entities/email-template.entity';
import { FormTemplate, FormTemplateType } from './entities/form-template.entity';
import { CfpTemplate } from './entities/cfp-template.entity';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateCfpTemplateDto } from './dto/create-cfp-template.dto';
import { UpdateCfpTemplateDto } from './dto/update-cfp-template.dto';
import { Conference } from '../conferences/entities/conference.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(FormTemplate)
    private formTemplateRepository: Repository<FormTemplate>,
    @InjectRepository(CfpTemplate)
    private cfpTemplateRepository: Repository<CfpTemplate>,
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
  ) {}

  // Email Templates
  async createEmailTemplate(
    conferenceId: number,
    createDto: CreateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }
    const existing = await this.emailTemplateRepository.findOne({
      where: { conferenceId, type: createDto.type },
    });

    if (existing) {
      throw new ConflictException(
        `Email template với type ${createDto.type} đã tồn tại cho conference này`,
      );
    }

    const template = this.emailTemplateRepository.create({
      ...createDto,
      conferenceId,
    });

    return await this.emailTemplateRepository.save(template);
  }

  async findAllEmailTemplates(conferenceId: number): Promise<EmailTemplate[]> {
    return await this.emailTemplateRepository.find({
      where: { conferenceId },
      order: { createdAt: 'DESC' },
    });
  }
// Lấy chi tiết một email template
  async findOneEmailTemplate(
    conferenceId: number,
    templateId: number,
  ): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id: templateId, conferenceId },
    });

    if (!template) {
      throw new NotFoundException(
        `Email template với ID ${templateId} không tồn tại`,
      );
    }

    return template;
  }

  async updateEmailTemplate(
    conferenceId: number,
    templateId: number,
    updateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.findOneEmailTemplate(conferenceId, templateId);

    if (updateDto.type && updateDto.type !== template.type) {
      const existing = await this.emailTemplateRepository.findOne({
        where: { conferenceId, type: updateDto.type },
      });

      if (existing && existing.id !== templateId) {
        throw new ConflictException(
          `Email template với type ${updateDto.type} đã tồn tại`,
        );
      }
    }

    Object.assign(template, updateDto);
    return await this.emailTemplateRepository.save(template);
  }
// Xóa email template
  async deleteEmailTemplate(
    conferenceId: number,
    templateId: number,
  ): Promise<void> {
    const template = await this.findOneEmailTemplate(conferenceId, templateId);
    await this.emailTemplateRepository.remove(template);
  }

  // Form Templates
  async createFormTemplate(
    conferenceId: number,
    createDto: CreateFormTemplateDto,
  ): Promise<FormTemplate> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }

    const existing = await this.formTemplateRepository.findOne({
      where: { conferenceId, type: createDto.type },
    });

    if (existing) {
      throw new ConflictException(
        `Form template với type ${createDto.type} đã tồn tại cho conference này`,
      );
    }

    const template = this.formTemplateRepository.create({
      ...createDto,
      conferenceId,
    });

    return await this.formTemplateRepository.save(template);
  }
// Lấy tất cả form templates
  async findAllFormTemplates(conferenceId: number): Promise<FormTemplate[]> {
    return await this.formTemplateRepository.find({
      where: { conferenceId },
      order: { createdAt: 'DESC' },
    });
  }
// Lấy chi tiết một form template
  async findOneFormTemplate(
    conferenceId: number,
    templateId: number,
  ): Promise<FormTemplate> {
    const template = await this.formTemplateRepository.findOne({
      where: { id: templateId, conferenceId },
    });

    if (!template) {
      throw new NotFoundException(
        `Form template với ID ${templateId} không tồn tại`,
      );
    }

    return template;
  }
// Cập nhật form template
  async updateFormTemplate(
    conferenceId: number,
    templateId: number,
    updateDto: UpdateFormTemplateDto,
  ): Promise<FormTemplate> {
    const template = await this.findOneFormTemplate(conferenceId, templateId);

    if (updateDto.type && updateDto.type !== template.type) {
      const existing = await this.formTemplateRepository.findOne({
        where: { conferenceId, type: updateDto.type },
      });

      if (existing && existing.id !== templateId) {
        throw new ConflictException(
          `Form template với type ${updateDto.type} đã tồn tại`,
        );
      }
    }

    Object.assign(template, updateDto);
    return await this.formTemplateRepository.save(template);
  }
// Xóa form template
  async deleteFormTemplate(
    conferenceId: number,
    templateId: number,
  ): Promise<void> {
    const template = await this.findOneFormTemplate(conferenceId, templateId);
    await this.formTemplateRepository.remove(template);
  }

  // CFP Templates
  async createOrUpdateCfpTemplate(
    conferenceId: number,
    createDto: CreateCfpTemplateDto,
  ): Promise<CfpTemplate> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }

    let template = await this.cfpTemplateRepository.findOne({
      where: { conferenceId },
    });

    if (template) {
      Object.assign(template, createDto);
    } else {
      template = this.cfpTemplateRepository.create({
        ...createDto,
        conferenceId,
      });
    }

    return await this.cfpTemplateRepository.save(template);
  }
// Lấy CFP template
  async getCfpTemplate(conferenceId: number): Promise<CfpTemplate | null> {
    return await this.cfpTemplateRepository.findOne({
      where: { conferenceId },
    });
  }
// Cập nhật CFP template
  async updateCfpTemplate(
    conferenceId: number,
    updateDto: UpdateCfpTemplateDto,
  ): Promise<CfpTemplate> {
    const template = await this.getCfpTemplate(conferenceId);

    if (!template) {
      throw new NotFoundException(
        `CFP template cho conference ${conferenceId} không tồn tại`,
      );
    }

    Object.assign(template, updateDto);
    return await this.cfpTemplateRepository.save(template);
  }
}




