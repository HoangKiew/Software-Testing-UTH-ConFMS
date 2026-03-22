import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = this.configService.get<string>('SUPABASE_KEY');
    const keyUsed = serviceRoleKey || anonKey;

    console.log('[SupabaseService] URL', supabaseUrl);
    console.log('[SupabaseService] keyType', serviceRoleKey ? 'service_role' : anonKey ? 'anon' : 'none');
    console.log('[SupabaseService] bucket', this.configService.get('SUPABASE_BUCKET_NAME'));

    if (supabaseUrl && keyUsed) {
      this.supabase = createClient(supabaseUrl, keyUsed);
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
