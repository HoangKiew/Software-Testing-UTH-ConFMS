import { memo } from 'react';

type TabType = 'assignment' | 'evaluate' | 'rebuttal';

interface ReviewerTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  canAccessEvaluate: boolean;
  canAccessRebuttal: boolean;
}

const ReviewerTabs = memo(({
  activeTab,
  onTabChange,
  canAccessEvaluate,
  canAccessRebuttal,
}: ReviewerTabsProps) => {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        onClick={() => onTabChange('assignment')}
        className={`p-3 md:px-6 md:py-3 font-medium transition-colors ${
          activeTab === 'assignment'
            ? 'border-b-2 border-teal-600 text-teal-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Phân công phản biện
      </button>
      <button
        onClick={() => canAccessEvaluate && onTabChange('evaluate')}
        className={`p-3 md:px-6 md:py-3 font-medium transition-colors ${
          activeTab === 'evaluate'
            ? 'border-b-2 border-teal-600 text-teal-600'
            : 'text-gray-600 hover:text-gray-800'
        } ${!canAccessEvaluate ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Đánh giá bài viết
      </button>
      <button
        onClick={() => canAccessRebuttal && onTabChange('rebuttal')}
        className={`p-3 md:px-6 md:py-3 font-medium transition-colors ${
          activeTab === 'rebuttal'
            ? 'border-b-2 border-teal-600 text-teal-600'
            : 'text-gray-600 hover:text-gray-800'
        } ${!canAccessRebuttal ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Cửa sổ phúc đáp
      </button>
    </div>
  );
});

ReviewerTabs.displayName = 'ReviewerTabs';

export default ReviewerTabs;


