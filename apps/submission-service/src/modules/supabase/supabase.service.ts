import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        // Lấy giá trị từ ConfigService và kiểm tra tồn tại để tránh lỗi TS2345
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        // Log giá trị biến môi trường để debug
        console.log('SUPABASE_URL:', supabaseUrl);
        console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey);

        // Nếu thiếu 1 trong 2, hệ thống sẽ báo lỗi ngay khi khởi động thay vì crash lúc chạy
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase URL hoặc Service Role Key bị thiếu trong file .env');
        }

        // Khởi tạo client với Service Role Key để bypass RLS (vì bạn đã khóa public)
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
        const bucketName = this.configService.get<string>('SUPABASE_BUCKET_NAME') || 'submission';

        const { data, error } = await this.supabase.storage
            .from(bucketName)
            .upload(path, file.buffer, {
                upsert: true,
                contentType: file.mimetype
            });

        if (error) {
            // Log chi tiết lỗi để debug
            console.error('Supabase upload error:', JSON.stringify(error, null, 2));
            console.error('Bucket name:', bucketName);
            console.error('Upload path:', path);

            // Trả về lỗi chi tiết nếu upload thất bại
            throw new InternalServerErrorException(`Lỗi Cloud Storage: ${error.message}`);
        }

        // Lấy URL công khai của file sau khi upload thành công
        const { data: publicUrlData } = this.supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    }
}