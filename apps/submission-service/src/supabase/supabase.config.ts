import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.supabase = null;
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error(
        'SUPABASE_URL và SUPABASE_KEY đang chưa được cấu hình đúng.',
      );
    }
    return this.supabase;
  }
}
