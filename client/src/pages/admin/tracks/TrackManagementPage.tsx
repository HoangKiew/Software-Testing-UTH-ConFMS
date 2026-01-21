import { useState, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetConferencesQuery } from '../../../redux/api/conferencesApi';
import type { Conference } from '../../../types/api.types';
import ConferenceListForTracks from './ConferenceListForTracks';
import TrackDetail from './TrackDetail';

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const TrackManagementPage = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useGetConferencesQuery();

  const conferences = useMemo(() => {
    return data?.data && Array.isArray(data.data) ? data.data : [];
  }, [data]);

  const filteredConferences = useMemo(() => {
    if (!searchQuery.trim()) {
      return conferences;
    }

    const normalizedQuery = removeVietnameseTones(searchQuery);
    return conferences.filter((conference: Conference) => {
      const normalizedName = removeVietnameseTones(conference.name);
      const normalizedDescription = conference.description
        ? removeVietnameseTones(conference.description)
        : '';

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedDescription.includes(normalizedQuery)
      );
    });
  }, [conferences, searchQuery]);

  const handleViewDetail = (conferenceId: number) => {
    setSelectedConferenceId(conferenceId);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedConferenceId(null);
  };

  if (view === 'detail' && selectedConferenceId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý Chủ đề</h1>
          </div>
        </div>
        <TrackDetail
          conferenceId={selectedConferenceId}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Chủ đề</h1>
        <div className="relative flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm hội nghị..."
            className="px-4 py-2 border text-text-main font-medium border-primary rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-8">
            <CircularProgress disableShrink />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Có lỗi xảy ra khi tải danh sách hội nghị
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <ConferenceListForTracks
          conferences={filteredConferences}
          searchQuery={searchQuery}
          onViewDetail={handleViewDetail}
        />
      )}
    </div>
  );
};

export default TrackManagementPage;
