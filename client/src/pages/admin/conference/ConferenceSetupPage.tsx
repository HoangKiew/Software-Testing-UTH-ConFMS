import { useState, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetConferencesQuery,
  useDeleteConferenceMutation,
} from '../../../redux/api/conferencesApi';
import type { Conference } from '../../../types/api.types';
import { showToast } from '../../../utils/toast';
import CreateConferenceForm from './CreateConferenceForm';
import ConferenceList from './ConferenceList';
import ConferenceDetail from './ConferenceDetail';

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const ConferenceSetupPage = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error } = useGetConferencesQuery();
  const [deleteConference] = useDeleteConferenceMutation();

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

  const handleCreateSuccess = (conferenceId: number) => {
    setShowCreateForm(false);
    setSelectedConferenceId(conferenceId);
    setView('detail');
  };

  const handleViewDetail = (conferenceId: number) => {
    setSelectedConferenceId(conferenceId);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedConferenceId(null);
  };

  const handleDelete = async (conferenceId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hội nghị này không?')) {
      return;
    }

    try {
      await deleteConference(conferenceId).unwrap();
      showToast.success('Xóa hội nghị thành công');
      // Nếu đang xem chi tiết của hội nghị bị xóa, quay về danh sách
      if (selectedConferenceId === conferenceId) {
        handleBackToList();
      }
    } catch (err) {
      console.error('Error deleting conference:', err);
      showToast.error('Có lỗi xảy ra khi xóa hội nghị');
    }
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
            <h1 className="text-3xl font-bold text-text-main">
              Thiết lập Hội nghị & Thời gian
            </h1>
          </div>
        </div>
        <ConferenceDetail
          conferenceId={selectedConferenceId}
          onBack={handleBackToList}
        />
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-main">
          Thiết lập Hội nghị & Thời gian
        </h1>
        <div className="relative flex items-center gap-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm hội nghị..."
            className="px-4 py-2 border text-text-main font-medium border-primary rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-700 transition-colors cursor-pointer"
            title={showCreateForm ? 'Ẩn form tạo hội nghị' : 'Tạo hội nghị mới'}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showCreateForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'}
              />
            </svg>
          </button>
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
        <div className="space-y-4">
          {showCreateForm && (
            <CreateConferenceForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <ConferenceList
            conferences={filteredConferences}
            searchQuery={searchQuery}
            onViewDetail={handleViewDetail}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};

export default ConferenceSetupPage;
