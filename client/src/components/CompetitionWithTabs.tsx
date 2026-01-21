import { useState } from 'react';
import Competition from './Competition';
import MySubmissions from './MySubmissions';

const CompetitionWithTabs = () => {
  const [activeTab, setActiveTab] = useState<'competitions' | 'my-submissions'>('competitions');

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Tabs */}
        <div className="flex justify-center mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('competitions')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'competitions'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cuộc thi
          </button>
          <button
            onClick={() => setActiveTab('my-submissions')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'my-submissions'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bài nộp của tôi
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'competitions' ? <Competition /> : <MySubmissions />}
        </div>
      </div>
    </div>
  );
};

export default CompetitionWithTabs;
