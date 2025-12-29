// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    action: string,
    userId: number | null,
    entity: string,
    entityId: string,
    changes?: any,
  ) {
    const log = this.auditRepo.create({
      action,
      userId,
      entity,
      entityId,
      changes,
    });
    await this.auditRepo.save(log);
  }
}