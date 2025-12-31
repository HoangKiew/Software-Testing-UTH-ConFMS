// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersClient } from '../users/users.client';

@Module({
  imports: [HttpModule],
  providers: [UsersClient],
  exports: [UsersClient],  // ← Quan trọng: export để module khác dùng được
})
export class UsersModule {}