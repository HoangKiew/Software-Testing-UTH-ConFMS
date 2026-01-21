import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetConferenceByIdQuery,
  useUpdateConferenceMutation,
  useSetCfpSettingsMutation,
} from '../../../redux/api/conferencesApi';
import { showToast } from '../../../utils/toast';

interface ConferenceDetailProps {
  conferenceId: number;
  onBack: () => void;
}

const formatDateForInput = (isoString: string): string => {
  const date = new Date(isoString);
  // Get local date components to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const ConferenceDetail = ({ conferenceId }: ConferenceDetailProps) => {
  const { data: conferenceDetail, isLoading } =
    useGetConferenceByIdQuery(conferenceId);
  const [updateConference, { isLoading: isUpdating }] =
    useUpdateConferenceMutation();
  const [setCfpSettings, { isLoading: isUpdatingCfp }] =
    useSetCfpSettingsMutation();

  const [conferenceFormData, setConferenceFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    venue: '',
    description: '',
    shortDescription: '',
    contactEmail: '',
  });

  const [cfpFormData, setCfpFormData] = useState({
    submissionDeadline: '',
    reviewDeadline: '',
    notificationDate: '',
    cameraReadyDeadline: '',
  });
  useEffect(() => {
    if (conferenceDetail?.data) {
      const conf = conferenceDetail.data;
      setConferenceFormData({
        name: conf.name || '',
        startDate: conf.startDate
          ? formatDateForInput(conf.startDate)
          : '',
        endDate: conf.endDate
          ? formatDateForInput(conf.endDate)
          : '',
        venue: conf.venue || '',
        description: conf.description || '',
        shortDescription: conf.shortDescription || '',
        contactEmail: conf.contactEmail || '',
      });

      if (
        conf.submissionDeadline ||
        conf.reviewDeadline ||
        conf.notificationDate ||
        conf.cameraReadyDeadline
      ) {
        setCfpFormData({
          submissionDeadline: conf.submissionDeadline
            ? formatDateForInput(conf.submissionDeadline)
            : '',
          reviewDeadline: conf.reviewDeadline
            ? formatDateForInput(conf.reviewDeadline)
            : '',
          notificationDate: conf.notificationDate
            ? formatDateForInput(conf.notificationDate)
            : '',
          cameraReadyDeadline: conf.cameraReadyDeadline
            ? formatDateForInput(conf.cameraReadyDeadline)
            : '',
        });
      }
    }
  }, [conferenceDetail]);

  const handleUpdateConference = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConference({
        id: conferenceId,
        name: conferenceFormData.name || undefined,
        startDate: conferenceFormData.startDate
          ? new Date(conferenceFormData.startDate).toISOString()
          : undefined,
        endDate: conferenceFormData.endDate
          ? new Date(conferenceFormData.endDate).toISOString()
          : undefined,
        venue: conferenceFormData.venue || undefined,
        description: conferenceFormData.description || undefined,
        shortDescription: conferenceFormData.shortDescription || undefined,
        contactEmail: conferenceFormData.contactEmail || undefined,
      }).unwrap();

      showToast.success('Cập nhật hội nghị thành công');
    } catch (err) {
      console.error('Error updating conference:', err);
      showToast.error('Có lỗi xảy ra khi cập nhật hội nghị');
    }
  };

  const handleUpdateCfp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setCfpSettings({
        conferenceId,
        submissionDeadline: new Date(
          cfpFormData.submissionDeadline,
        ).toISOString(),
        reviewDeadline: new Date(cfpFormData.reviewDeadline).toISOString(),
        notificationDate: new Date(cfpFormData.notificationDate).toISOString(),
        cameraReadyDeadline: new Date(
          cfpFormData.cameraReadyDeadline,
        ).toISOString(),
      }).unwrap();

      showToast.success('Cập nhật thời gian thành công');
    } catch (err) {
      console.error('Error updating CFP:', err);
      showToast.error('Có lỗi xảy ra khi cập nhật CFP');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Thông tin Hội nghị
        </h2>
        <form onSubmit={handleUpdateConference} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên hội nghị
              </label>
              <input
                type="text"
                value={conferenceFormData.name}
                onChange={(e) =>
                  setConferenceFormData({
                    ...conferenceFormData,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa điểm
              </label>
              <input
                type="text"
                value={conferenceFormData.venue}
                onChange={(e) =>
                  setConferenceFormData({
                    ...conferenceFormData,
                    venue: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="datetime-local"
                value={conferenceFormData.startDate}
                onChange={(e) =>
                  setConferenceFormData({
                    ...conferenceFormData,
                    startDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                value={conferenceFormData.endDate}
                onChange={(e) =>
                  setConferenceFormData({
                    ...conferenceFormData,
                    endDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                value={conferenceFormData.description}
                onChange={(e) =>
                  setConferenceFormData({
                    ...conferenceFormData,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={conferenceFormData.contactEmail}
                onChange={(e) =>
                  setConferenceFormData({
                    ...conferenceFormData,
                    contactEmail: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Đang cập nhật...' : 'Cập nhật hội nghị'}
            </button>
          </div>
        </form>
      </div>
      {/* Set Thời gian deadline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cài đặt CFP</h2>
        <form onSubmit={handleUpdateCfp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn nộp bài
            </label>
            <input
              type="datetime-local"
              value={cfpFormData.submissionDeadline}
              onChange={(e) =>
                setCfpFormData({
                  ...cfpFormData,
                  submissionDeadline: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn phản biện
            </label>
            <input
              type="datetime-local"
              value={cfpFormData.reviewDeadline}
              onChange={(e) =>
                setCfpFormData({
                  ...cfpFormData,
                  reviewDeadline: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày thông báo
            </label>
            <input
              type="datetime-local"
              value={cfpFormData.notificationDate}
              onChange={(e) =>
                setCfpFormData({
                  ...cfpFormData,
                  notificationDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn nộp bản hoàn thiện (Camera-ready)
            </label>
            <input
              type="datetime-local"
              value={cfpFormData.cameraReadyDeadline}
              onChange={(e) =>
                setCfpFormData({
                  ...cfpFormData,
                  cameraReadyDeadline: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingCfp}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingCfp ? 'Đang cập nhật...' : 'Cập nhật thời gian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConferenceDetail;
