import { useState, useMemo } from 'react';
import {
  useGetConferencesQuery,
  useGetDashboardStatsQuery,
  useGetTracksQuery,
} from '../../../redux/api/conferencesApi';
import CircularProgress from '@mui/material/CircularProgress';

const ReportsPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const { data: conferencesData, isLoading: conferencesLoading } =
    useGetConferencesQuery();
  const { data: tracksData } = useGetTracksQuery(selectedConferenceId!, {
    skip: !selectedConferenceId,
  });
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useGetDashboardStatsQuery(selectedConferenceId!, {
    skip: !selectedConferenceId,
  });

  const conferences = useMemo(() => {
    return conferencesData?.data && Array.isArray(conferencesData.data)
      ? conferencesData.data
      : [];
  }, [conferencesData]);
  useMemo(() => {
    if (!selectedConferenceId && conferences.length > 0) {
      setSelectedConferenceId(conferences[0].id);
    }
  }, [conferences, selectedConferenceId]);

  const tracks = useMemo(() => {
    return tracksData?.data && Array.isArray(tracksData.data)
      ? tracksData.data
      : [];
  }, [tracksData]);

  // Get stats from API
  const stats = dashboardData?.data || {
    totalSubmissions: 0,
    totalSubmissionsChange: undefined,
    acceptanceRate: 0,
    acceptanceRateChange: undefined,
    totalAccepted: 0,
    totalRejected: 0,
    totalReviewers: 0,
  };

  const trackStats = useMemo(() => {
    if (!dashboardData?.data?.submissionsByTrack) return [];
    return dashboardData.data.submissionsByTrack.map((track) => ({
      name: track.trackName,
      submissions: track.submissions,
      accepted: track.accepted,
      rejected: track.rejected,
    }));
  }, [dashboardData]);

  const statusDistribution = dashboardData?.data?.statusDistribution || {
    accepted: 0,
    rejected: 0,
    reviewing: 0,
  };
  const totalForChart = stats.totalSubmissions || 1;
  const acceptedPercent = (statusDistribution.accepted / totalForChart) * 100;
  const rejectedPercent = (statusDistribution.rejected / totalForChart) * 100;
  const reviewingPercent = (statusDistribution.reviewing / totalForChart) * 100;

  const circumference = 251.2;
  const acceptedDash = (acceptedPercent / 100) * circumference;
  const rejectedDash = (rejectedPercent / 100) * circumference;
  const reviewingDash = (reviewingPercent / 100) * circumference;

  const maxSubmissions =
    trackStats.length > 0
      ? Math.max(...trackStats.map((t) => t.submissions), 1)
      : 1;

  if (conferencesLoading || dashboardLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress disableShrink />
      </div>
    );
  }

  // Show error if dashboard stats failed to load
  if (dashboardError && selectedConferenceId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Báo cáo và Phân tích
            </h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Lỗi khi tải dữ liệu thống kê
            </h2>
            <p className="text-red-600">
              {dashboardError && 'data' in dashboardError 
                ? (dashboardError.data as any)?.message || 'Không thể tải dữ liệu thống kê'
                : 'Không thể tải dữ liệu thống kê'}
            </p>
            <p className="text-sm text-red-500 mt-2">
              Vui lòng thử lại sau hoặc liên hệ quản trị viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Báo cáo và Phân tích
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Lọc theo:
              </label>
              <select
                value={selectedConferenceId || ''}
                onChange={(e) => {
                  const confId = e.target.value ? Number(e.target.value) : null;
                  setSelectedConferenceId(confId);
                  setSelectedTrackId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Chọn hội nghị</option>
                {conferences.map((conf) => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedTrackId || ''}
                onChange={(e) =>
                  setSelectedTrackId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                disabled={!selectedConferenceId}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả chủ đề</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Show message if no conference selected */}
        {!selectedConferenceId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">
              Vui lòng chọn hội nghị để xem thống kê
            </p>
          </div>
        )}

        {/* Summary Cards */}
        {selectedConferenceId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Submissions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Tổng bài nộp</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalSubmissions}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.totalSubmissionsChange && (
                <span
                  className={`text-sm font-medium ${stats.totalSubmissionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.totalSubmissionsChange >= 0 ? '+' : ''}
                  {stats.totalSubmissionsChange}%
                </span>
              )}
              <span className="text-xs text-gray-500">Tất cả phân ban</span>
            </div>
          </div>

          {/* Acceptance Rate Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Tỷ lệ chấp nhận</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalSubmissions > 0 
                  ? stats.acceptanceRate.toFixed(1) 
                  : '0.0'}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.acceptanceRateChange && (
                <span
                  className={`text-sm font-medium ${stats.acceptanceRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.acceptanceRateChange >= 0 ? '+' : ''}
                  {stats.acceptanceRateChange}%
                </span>
              )}
              <span className="text-xs text-gray-500">
                {stats.totalAccepted}/{stats.totalSubmissions} bài
              </span>
            </div>
          </div>

          {/* Reviewers Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Phản biện viên</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalReviewers}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Đang hoạt động</span>
            </div>
          </div>
        </div>
        )}

        {/* Charts Section */}
        {selectedConferenceId && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thống kê bài nộp theo phân ban
              </h3>
              <div className="space-y-4">
                {trackStats.map((track, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {track.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {track.submissions} bài
                      </span>
                    </div>
                    <div className="flex gap-2 h-8">
                      {/* Submissions bar */}
                      <div
                        className="bg-blue-500 rounded-l"
                        style={{
                          width: `${(track.submissions / maxSubmissions) * 100}%`,
                        }}
                        title={`Bài nộp: ${track.submissions}`}
                      />
                      {/* Accepted bar */}
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(track.accepted / maxSubmissions) * 100}%`,
                        }}
                        title={`Chấp nhận: ${track.accepted}`}
                      />
                      {/* Rejected bar */}
                      <div
                        className="bg-red-500 rounded-r"
                        style={{
                          width: `${(track.rejected / maxSubmissions) * 100}%`,
                        }}
                        title={`Từ chối: ${track.rejected}`}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-500 rounded"></span>
                        Bài nộp: {track.submissions}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-500 rounded"></span>
                        Chấp nhận: {track.accepted}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded"></span>
                        Từ chối: {track.rejected}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tỷ lệ chấp nhận bài
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Pie Chart using CSS */}
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Accepted segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${acceptedDash} ${circumference}`}
                      strokeDashoffset="0"
                    />
                    {/* Rejected segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${rejectedDash} ${circumference}`}
                      strokeDashoffset={`-${acceptedDash}`}
                    />
                    {/* Reviewing segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeDasharray={`${reviewingDash} ${circumference}`}
                      strokeDashoffset={`-${acceptedDash + rejectedDash}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalSubmissions > 0 
                          ? stats.acceptanceRate.toFixed(1) 
                          : '0.0'}%
                      </p>
                      <p className="text-xs text-gray-500">Chấp nhận</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    <span className="text-sm text-gray-700">
                      Chấp nhận: {acceptedPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded"></span>
                    <span className="text-sm text-gray-700">
                      Từ chối: {rejectedPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-500 rounded"></span>
                    <span className="text-sm text-gray-700">
                      Đang xét: {reviewingPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
