import CircularProgress from '@mui/material/CircularProgress';
import { useGetConferencesQuery } from '../redux/api/conferencesApi';
import type { Conference } from '../types/api.types';

const Competition = () => {
  const { data, isLoading, error } = useGetConferencesQuery();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const getConferenceStatus = (c: Conference) => {
    const now = new Date();
    const submissionDeadline = c.cfpSetting?.submissionDeadline || c.submissionDeadline;
    const notificationDate = c.cfpSetting?.notificationDate || c.notificationDate;
    const cameraReadyDeadline = c.cfpSetting?.cameraReadyDeadline || c.cameraReadyDeadline;
    const conferenceStartDate = new Date(c.startDate);
    if (submissionDeadline) {
      const submissionDate = new Date(submissionDeadline);
      if (now < conferenceStartDate) {
        return { text: 'Chưa mở', color: 'border-3 border-gray-400' };
      }
      if (now >= conferenceStartDate && now < submissionDate) {
        return { text: 'Đang nhận bài nộp', color: 'border-3 border-green-500' };
      }
    }
    if (submissionDeadline && notificationDate) {
      const submissionDate = new Date(submissionDeadline);
      const notificationDateObj = new Date(notificationDate);
      if (now >= submissionDate && now < notificationDateObj) {
        return { text: 'Đang phản biện', color: 'bg-blue-500' };
      }
    }
    if (notificationDate && cameraReadyDeadline) {
      const notificationDateObj = new Date(notificationDate);
      const cameraReadyDate = new Date(cameraReadyDeadline);
      if (now >= notificationDateObj && now < cameraReadyDate) {
        return { text: 'Nộp bản hoàn thiện', color: 'border-3 border-yellow-500' };
      }
    }
    
    if (!submissionDeadline && !notificationDate && !cameraReadyDeadline) {
      return { text: 'Đã đóng', color: 'border-3 border-red-300' };
    }
    
    // Nếu đã qua tất cả các deadline
    return { text: 'Đã đóng', color: 'border-3 border-red-300' };
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <CircularProgress disableShrink />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Lỗi khi tải hội nghị. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  const conferences = data?.data || [];

  if (conferences.length === 0) {
    return (
      <div
        id="conferences"
        className="bg-white max-w-custom w-[1360px] ml-auto mr-auto"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Chưa có hội nghị nào để hiển thị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto" id='conferences'>
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Hội nghị gần đây
        </h1>

        <div className="space-y-4">
          {conferences.map((c: Conference) => (
            <div
              key={c.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start justify-between"
            >
              <div className="flex-1 pr-6">
                <h2 className="text-md md:text-xl font-semibold text-gray-800 mb-6 ">
                  {c.name}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {formatDate(c.startDate)} - {formatDate(c.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <div className="mb-3">
                  {(() => {
                    const status = getConferenceStatus(c);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full ${status.color} text-black text-sm font-medium`}>
                        {status.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Competition;
