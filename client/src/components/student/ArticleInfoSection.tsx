import type { Track } from '../../types/api.types';

interface ArticleInfoSectionProps {
  title: string;
  abstract: string;
  keywords: string;
  selectedTrackId: number | undefined;
  tracks: Track[];
  onTitleChange: (value: string) => void;
  onAbstractChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onTrackChange: (trackId: number) => void;
}

const ArticleInfoSection = ({
  title,
  abstract,
  keywords,
  selectedTrackId,
  tracks,
  onTitleChange,
  onAbstractChange,
  onKeywordsChange,
  onTrackChange,
}: ArticleInfoSectionProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin bài viết</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề của bài viết <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Nhập tiêu đề nghiên cứu của bạn"
            className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tóm tắt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={abstract}
            onChange={(e) => onAbstractChange(e.target.value)}
            placeholder="Nhập tóm tắt nghiên cứu (200 - 300 từ)"
            rows={6}
            className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ khóa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder="Nhập các từ khóa, phân cách bằng dấu phẩy"
            className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ví dụ: machine learning, artificial intelligence, deep learning
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chủ đề (Track) <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedTrackId || ''}
            onChange={(e) => onTrackChange(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
          >
            <option value="">Chọn chủ đề</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ArticleInfoSection;


