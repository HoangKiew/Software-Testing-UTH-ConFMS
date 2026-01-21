import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetMyTrackAssignmentsQuery } from '../../redux/api/conferencesApi';
import { showToast } from '../../utils/toast';
import { tokenUtils } from '../../utils/token';
import ReviewerTabs from '../../components/reviewer/ReviewerTabs';
import TrackAssignmentList from './TrackAssignmentList';
import TrackSubmissionsView from './TrackSubmissionsView';

// Lazy load heavy components
const ReviewForm = lazy(() => import('./ReviewForm'));
const RebuttalWindow = lazy(() => import('./RebuttalWindow'));

type TabType = 'assignment' | 'evaluate' | 'rebuttal';

const ReviewerDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('assignment');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  // Check if user tries to access evaluate/rebuttal tab without selecting a submission
  useEffect(() => {
    if (activeTab === 'evaluate' && (!selectedSubmissionId || !selectedAssignmentId)) {
      showToast.error('Vui lòng chọn bài viết để đánh giá');
      setActiveTab('assignment');
    }
    if (activeTab === 'rebuttal' && !selectedSubmissionId) {
      showToast.error('Vui lòng chọn bài viết để xem phúc đáp');
      setActiveTab('assignment');
    }
  }, [activeTab, selectedSubmissionId, selectedAssignmentId]);

  const hasToken = tokenUtils.hasToken();
  const { data: trackAssignmentsData, isLoading: trackAssignmentsLoading, error: trackAssignmentsError } = useGetMyTrackAssignmentsQuery(undefined, {
    skip: !hasToken,
  });
  
  const acceptedTrackAssignments = useMemo(
    () => trackAssignmentsData?.data?.filter(
      (ta) => {
        const status = ta.status || 'PENDING';
        return status === 'ACCEPTED' && ta.track;
      }
    ) || [],
    [trackAssignmentsData?.data]
  );

  if (trackAssignmentsLoading) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-8">
            <CircularProgress disableShrink />
          </div>
        </div>
      </div>
    );
  }

  if (trackAssignmentsError) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-8">
            <div className="text-red-600">Lỗi tải dữ liệu phân công</div>
          </div>
        </div>
      </div>
    );
  }

  const handleEvaluateSubmission = (submissionId: string, assignmentId: number) => {
    setSelectedSubmissionId(submissionId);
    setSelectedAssignmentId(assignmentId);
    setActiveTab('evaluate');
  };

  const handleReviewComplete = () => {
    setActiveTab('rebuttal');
  };

  const handleBackToSubmissions = () => {
    setSelectedSubmissionId(null);
    setSelectedAssignmentId(null);
    setActiveTab('assignment');
  };

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Tabs */}
        <ReviewerTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'assignment') {
              setSelectedSubmissionId(null);
              setSelectedAssignmentId(null);
              setActiveTab(tab);
            } else if (tab === 'evaluate') {
              if (selectedSubmissionId && selectedAssignmentId) {
                setActiveTab(tab);
              } else {
                showToast.error('Vui lòng chọn bài viết để đánh giá');
              }
            } else if (tab === 'rebuttal') {
              if (selectedSubmissionId) {
                setActiveTab(tab);
              } else {
                showToast.error('Vui lòng chọn bài viết để xem phúc đáp');
              }
            }
          }}
          canAccessEvaluate={!!(selectedSubmissionId && selectedAssignmentId)}
          canAccessRebuttal={!!selectedSubmissionId}
        />

        {/* Content */}
        <div>
          {activeTab === 'assignment' && (
            <>
              {/* Hiển thị các track assignments đang chờ chấp nhận/từ chối */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Phân công chờ xác nhận
                </h2>
                <TrackAssignmentList
                  onAcceptTrack={(trackId, conferenceId) => {
                  }}
                />
              </div>
              
              {/* Hiển thị các track đã chấp nhận với các bài nộp */}
              {acceptedTrackAssignments.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Các chủ đề đã chấp nhận
                  </h2>
                  <div className="space-y-4">
                    {acceptedTrackAssignments.map((trackAssignment) => (
                      <TrackSubmissionsView
                        key={trackAssignment.id}
                        trackAssignment={trackAssignment}
                        onEvaluate={handleEvaluateSubmission}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'evaluate' && selectedSubmissionId && selectedAssignmentId && (
            <Suspense fallback={
              <div className="flex justify-center items-center py-8">
                <CircularProgress disableShrink />
              </div>
            }>
              <ReviewForm
                submissionId={selectedSubmissionId}
                assignmentId={selectedAssignmentId}
                onComplete={handleReviewComplete}
                onBack={handleBackToSubmissions}
              />
            </Suspense>
          )}

          {activeTab === 'evaluate' && (!selectedSubmissionId || !selectedAssignmentId) && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Vui lòng chọn bài viết để đánh giá
            </div>
          )}

          {activeTab === 'rebuttal' && selectedSubmissionId && (
            <Suspense fallback={
              <div className="flex justify-center items-center py-8">
                <CircularProgress disableShrink />
              </div>
            }>
              <RebuttalWindow submissionId={selectedSubmissionId} />
            </Suspense>
          )}

          {activeTab === 'rebuttal' && !selectedSubmissionId && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Vui lòng chọn bài viết để xem phúc đáp
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;

