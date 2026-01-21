import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetMySubmissionsQuery } from '../redux/api/submissionsApi';
import { useGetConferencesQuery } from '../redux/api/conferencesApi';
import type { Submission, SubmissionStatus } from '../types/api.types';

const MySubmissions = () => {
  const navigate = useNavigate();
  const { data: submissionsData, isLoading: submissionsLoading, error: submissionsError } = useGetMySubmissionsQuery();
  const { data: conferencesData } = useGetConferencesQuery();
  
  const submissions: Submission[] = submissionsData?.data || [];
  const conferences = conferencesData?.data || [];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'border-3 border-gray-400';
      case 'SUBMITTED':
        return 'border-3 border-blue-400';
      case 'REVIEWING':
        return 'border-3 border-yellow-400';
      case 'ACCEPTED':
        return 'border-3 border-green-500';
      case 'REJECTED':
        return 'border-3 border-red-500';
      case 'CAMERA_READY':
        return 'border-3 border-purple-500';
      case 'WITHDRAWN':
        return 'border-3 border-gray-500';
      default:
        return 'border-3 border-gray-400';
    }
  };

  const getStatusLabel = (status: SubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'Bản nháp';
      case 'SUBMITTED':
        return 'Đã nộp';
      case 'REVIEWING':
        return 'Đang phản biện';
      case 'ACCEPTED':
        return 'Đã chấp nhận';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'CAMERA_READY':
        return 'Bản hoàn thiện';
      case 'WITHDRAWN':
        return 'Đã rút';
      default:
        return status;
    }
  };

  const getConferenceName = (conferenceId: number) => {
    const conference = conferences.find(c => c.id === conferenceId);
    return conference?.name || `Hội nghị #${conferenceId}`;
  };

  if (submissionsLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <CircularProgress disableShrink />
      </div>
    );
  }

  if (submissionsError) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Lỗi khi tải bài nộp. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-center">Bạn chưa có bài nộp nào.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto">

        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start justify-between"
            >
              <div className="flex-1 pr-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {submission.title}
                </h2>
                <div className="flex flex-col gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-3">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>{getConferenceName(submission.conferenceId)}</span>
                  </div>
                  {submission.submittedAt && (
                    <div className="flex items-center gap-3">
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
                      <span>Ngày nộp: {formatDate(submission.submittedAt)}</span>
                    </div>
                  )}
                  {submission.createdAt && (
                    <div className="flex items-center gap-3">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Tạo: {formatDate(submission.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-3">
                <div>
                  {(() => {
                    const statusColor = getStatusColor(submission.status);
                    const statusLabel = getStatusLabel(submission.status);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full ${statusColor} text-black text-sm font-medium`}>
                        {statusLabel}
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={() => navigate(`/student/submission/${submission.id}`)}
                  className="px-4 py-2 text-teal-600 border border-teal-600 rounded-xl hover:bg-teal-50 hover:cursor-pointer transition-colors text-sm"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MySubmissions;
