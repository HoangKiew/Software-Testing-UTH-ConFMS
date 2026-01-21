import { useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import { useGetReviewsForSubmissionQuery } from '../../redux/api/reviewsApi';
import { useGetConferenceByIdQuery } from '../../redux/api/conferencesApi';
import RebuttalHeader from '../../components/reviewer/RebuttalHeader';
import ReviewCard from '../../components/reviewer/ReviewCard';

interface RebuttalWindowProps {
  submissionId: string;
}

const RebuttalWindow = ({ submissionId }: RebuttalWindowProps) => {
  const { data: submissionData } = useGetSubmissionByIdQuery(submissionId);
  const { data: reviewsData } = useGetReviewsForSubmissionQuery(submissionId);
  
  const submission = submissionData?.data;
  const reviews = reviewsData?.data || [];

  // Fetch conference to get deadline
  const { data: conferenceData } = useGetConferenceByIdQuery(submission?.conferenceId || 0, {
    skip: !submission?.conferenceId,
  });
  const conference = conferenceData?.data;

  const calculateDaysLeft = (deadline: string): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate statistics (memoized) - MUST be called before early return
  const { totalReviews, averageScore } = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0
      ? (reviews.reduce((sum, r) => sum + r.score, 0) / total).toFixed(1)
      : '0.0';
    return { totalReviews: total, averageScore: avg };
  }, [reviews]);

  if (!submission) {
    return (
      <div className="flex justify-center items-center py-8">
        <CircularProgress disableShrink />
      </div>
    );
  }

  // Get deadline from conference (same pattern as other components)
  const submissionDeadline = conference?.cfpSetting?.submissionDeadline || conference?.submissionDeadline;
  const daysLeft = submissionDeadline ? calculateDaysLeft(submissionDeadline) : 0;

  return (
    <div className="space-y-6">
      <RebuttalHeader
        totalReviews={totalReviews}
        averageScore={averageScore}
        submissionDeadline={submissionDeadline}
        daysLeft={daysLeft}
      />

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default RebuttalWindow;


