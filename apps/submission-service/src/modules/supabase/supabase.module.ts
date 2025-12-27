import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Để các module khác (như Submission) dùng luôn mà không cần import lại
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule { }