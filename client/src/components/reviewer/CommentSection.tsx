import { memo } from 'react';

interface CommentSectionProps {
  comment: string;
  onCommentChange: (comment: string) => void;
  disabled?: boolean;
}

const CommentSection = memo(({ comment, onCommentChange, disabled }: CommentSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Bình luận</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nhận xét chi tiết <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => !disabled && onCommentChange(e.target.value)}
          disabled={disabled}
          placeholder="Nhập điểm mạnh, điểm yếu và đề xuất cải thiện..."
          rows={8}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
      </div>
    </div>
  );
});

CommentSection.displayName = 'CommentSection';

export default CommentSection;

