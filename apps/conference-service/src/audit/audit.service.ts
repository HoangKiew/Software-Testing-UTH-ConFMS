import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    conferenceId: number | null,
    userId: number,
    action: string,
    resourceType: string,
    resourceId: number | null = null,
    oldValue: Record<string, any> | null = null,
    newValue: Record<string, any> | null = null,
    description: string | null = null,
    ipAddress: string | null = null,
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      conferenceId,
      userId,
      action,
      resourceType,
      resourceId,
      oldValue,
      newValue,
      description,
      ipAddress,
    });

    return await this.auditLogRepository.save(log);
  }
// Tìm kiếm tất cả các audit log, có thể lọc theo conferenceId
  async findAll(conferenceId: number | null = null): Promise<AuditLog[]> {
    const where = conferenceId ? { conferenceId } : {};
    return await this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100, 
    });
  }
// Tìm kiếm các audit log theo loại tài nguyên và ID tài nguyên
  async findByResource(
    resourceType: string,
    resourceId: number,
  ): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
    });
  }
}









