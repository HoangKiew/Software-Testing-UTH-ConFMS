import { 
  Injectable, 
  OnModuleInit, 
  BadRequestException, 
  InternalServerErrorException, 
  NotFoundException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Submission } from './entities/submission.entity';
import { SubmissionFile } from './entities/submission-file.entity';

@Injectable()
export class SubmissionServiceService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Submission) private subRepo: Repository<Submission>,
    @InjectRepository(SubmissionFile) private fileRepo: Repository<SubmissionFile>,
  ) {}

  onModuleInit() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!, 
      process.env.SUPABASE_ANON_KEY!
    );
  }

  // --- API 1: LẤY DANH SÁCH BÀI NỘP THEO USER ---
  async getSubmissionsByUser(userId: number) {
    try {
      const submissions = await this.subRepo.find({
        where: { created_by: userId },
        relations: ['files'], // Lấy luôn danh sách các version v1, v2... đính kèm
        order: { id: 'DESC' }
      });

      if (!submissions || submissions.length === 0) {
        throw new NotFoundException(`Không tìm thấy bài nộp nào của User ID ${userId}`);
      }

      return {
        status: 'success',
        data: submissions
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy danh sách bài nộp');
    }
  }

  // --- API 2: XỬ LÝ NỘP BÀI (ĐÃ THÊM EXCEPTION HANDLING) ---
  async handleSubmission(file: Express.Multer.File, dto: any) {
    try {
      // 1. Kiểm tra/Tạo Submission
      let sub = await this.subRepo.findOne({ 
        where: { title: dto.title, created_by: dto.createdBy } 
      });

      if (!sub) {
        sub = await this.subRepo.save({ 
          title: dto.title, 
          conference_id: dto.conferenceId, 
          created_by: dto.createdBy,
          abstract: dto.abstract || ''
        });
      }

      // 2. Tính Version
      const version = await this.getNextVersion(sub.id);

      // 3. Chuẩn bị đường dẫn
      const fileExt = file.originalname.split('.').pop();
      const fileName = `v${version}.${fileExt}`;
      const path = `papers/${sub.id}/${fileName}`;

      // 4. Upload Supabase
      const { error: uploadError } = await this.supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME!)
        .upload(path, file.buffer, { 
          contentType: file.mimetype,
          upsert: true 
        });

      if (uploadError) {
        throw new BadRequestException(`Lỗi Cloud Storage: ${uploadError.message}`);
      }

      // 5. Lấy URL công khai
      const { data: { publicUrl } } = this.supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME!)
        .getPublicUrl(path);
      
      // 6. Lưu vào Database
      const savedFile = await this.fileRepo.save({
        submission_id: sub.id,
        file_path: publicUrl,
        version: version
      });

      return {
        status: 'success',
        message: `Đã lưu bài nộp và file phiên bản v${version} thành công`,
        data: {
          submissionId: sub.id,
          fileId: savedFile.id,
          version: version,
          url: publicUrl
        }
      };

    } catch (error) {
      console.error('CRITICAL ERROR:', error);
      // Nếu là lỗi mình chủ động throw (BadRequest, NotFound), thì gửi thẳng về Client
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Các lỗi lạ (DB sập, Network...) thì trả về 500 kèm thông báo sạch
      throw new InternalServerErrorException('Có lỗi xảy ra trong quá trình xử lý bài nộp. Vui lòng thử lại sau.');
    }
  }

  private async getNextVersion(subId: number): Promise<number> {
    try {
      const count = await this.fileRepo.count({ where: { submission_id: subId } });
      return count + 1;
    } catch (e) {
      return 1;
    }
  }

  async checkDeadline(confId: number) {
    return true; 
  }
}