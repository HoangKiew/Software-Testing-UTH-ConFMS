import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionsQuery } from '../../../redux/api/submissionsApi';
import { useGetConferencesQuery, useGetTracksQuery } from '../../../redux/api/conferencesApi';
import { useGetReviewsForSubmissionQuery } from '../../../redux/api/reviewsApi';
import ReviewedSubmissionCard from '../../../components/admin/ReviewedSubmissionCard';
import type { Submission } from '../../../types/api.types';

const AssignmentsPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conferences
  const { data: conferencesData, isLoading: conferencesLoading } = useGetConferencesQuery();

  // Fetch tracks for selected conference
  const { data: tracksData, isLoading: tracksLoading } = useGetTracksQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId },
  );

  // Fetch submissions - only get REVIEWING status (submissions currently being reviewed)
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
  } = useGetSubmissionsQuery({
    conferenceId: selectedConferenceId || undefined,
    trackId: selectedTrackId || undefined,
    status: 'REVIEWING',
    search: searchQuery || undefined,
  });

  const conferences = useMemo(() => {
    return conferencesData?.data && Array.isArray(conferencesData.data)
      ? conferencesData.data
      : [];
  }, [conferencesData]);

  const tracks = useMemo(() => {
    return tracksData?.data && Array.isArray(tracksData.data)
      ? tracksData.data
      : [];
  }, [tracksData]);

  const allSubmissions = useMemo(() => {
    return submissionsData?.data && Array.isArray(submissionsData.data)
      ? submissionsData.data
      : [];
  }, [submissionsData]);

  // Filter by status (only REVIEWING) and search query
  const searchFilteredSubmissions = useMemo(() => {
    // First filter by status - only show REVIEWING
    const reviewingSubmissions = allSubmissions.filter(
      (s) => s.status === 'REVIEWING',
    );
    
    // Then filter by search query if provided
    if (!searchQuery.trim()) {
      return reviewingSubmissions;
    }
    const query = searchQuery.toLowerCase();
    return reviewingSubmissions.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.authorName?.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query),
    );
  }, [allSubmissions, searchQuery]);

  const handleViewDetails = (submissionId: string) => {
  };


  if (conferencesLoading || submissionsLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-16">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conference Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hội nghị
            </label>
            <select
              value={selectedConferenceId || ''}
              onChange={(e) => {
                setSelectedConferenceId(e.target.value ? Number(e.target.value) : null);
                setSelectedTrackId(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tất cả hội nghị</option>
              {conferences.map((conference) => (
                <option key={conference.id} value={conference.id}>
                  {conference.name}
                </option>
              ))}
            </select>
          </div>

          {/* Track Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chủ đề
            </label>
            <select
              value={selectedTrackId || ''}
              onChange={(e) => setSelectedTrackId(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedConferenceId || tracksLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tất cả chủ đề</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, tác giả, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <SubmissionsListWithReviews
        submissions={searchFilteredSubmissions}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};

// Component to render list of submissions, only showing those with reviews
interface SubmissionsListWithReviewsProps {
  submissions: Submission[];
  onViewDetails: (submissionId: string) => void;
}

const SubmissionsListWithReviews = ({ submissions, onViewDetails }: SubmissionsListWithReviewsProps) => {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Không tìm thấy bài nộp nào phù hợp với bộ lọc
      </div>
    );
  }

  // Track which submissions have reviews and loading states using refs to avoid re-renders
  const submissionsWithReviewsRef = useRef<Set<string>>(new Set());
  const loadingSubmissionsRef = useRef<Set<string>>(new Set());
  const [hasAnyReviews, setHasAnyReviews] = useState(false);
  const [allQueriesDone, setAllQueriesDone] = useState(false);

  // Memoized callbacks to prevent infinite loops
  const handleHasReviews = useCallback((submissionId: string, hasReviews: boolean) => {
    if (hasReviews) {
      submissionsWithReviewsRef.current.add(submissionId);
      setHasAnyReviews(true);
    }
  }, []);

  const handleLoadingChange = useCallback((submissionId: string, isLoading: boolean) => {
    if (isLoading) {
      loadingSubmissionsRef.current.add(submissionId);
    } else {
      loadingSubmissionsRef.current.delete(submissionId);
      // Check if all queries are done
      if (loadingSubmissionsRef.current.size === 0) {
        setAllQueriesDone(true);
        // If no submissions have reviews, show message
        if (submissionsWithReviewsRef.current.size === 0) {
          setHasAnyReviews(false);
        }
      }
    }
  }, []);

  return (
    <>
      <div className="space-y-4">
        {submissions.map((submission) => (
          <SubmissionWithReviews
            key={submission.id}
            submission={submission}
            onViewDetails={onViewDetails}
            onHasReviews={handleHasReviews}
            onLoadingChange={handleLoadingChange}
          />
        ))}
      </div>
      
      {/* Show message if no submissions have reviews after all queries complete */}
      {allQueriesDone && !hasAnyReviews && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 mt-4">
          Chưa có bài nộp nào đã được phản biện
        </div>
      )}
    </>
  );
};

// Component to fetch reviews for each submission
interface SubmissionWithReviewsProps {
  submission: Submission;
  onViewDetails: (submissionId: string) => void;
  onHasReviews?: (submissionId: string, hasReviews: boolean) => void;
  onLoadingChange?: (submissionId: string, isLoading: boolean) => void;
}

const SubmissionWithReviews = ({ 
  submission, 
  onViewDetails,
  onHasReviews,
  onLoadingChange,
}: SubmissionWithReviewsProps) => {
  const { data: reviewsData, isLoading } = useGetReviewsForSubmissionQuery(submission.id);
  const reviews = reviewsData?.data || [];
  const hasNotifiedRef = useRef(false);

  // Notify parent about loading state (only once per state change)
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(submission.id, isLoading);
    }
  }, [isLoading, submission.id, onLoadingChange]);

  // Notify parent about reviews status (only once when data is loaded)
  useEffect(() => {
    if (!isLoading && onHasReviews && !hasNotifiedRef.current) {
      onHasReviews(submission.id, reviews.length > 0);
      hasNotifiedRef.current = true;
    }
    // Reset notification flag when loading starts again
    if (isLoading) {
      hasNotifiedRef.current = false;
    }
  }, [isLoading, reviews.length, submission.id, onHasReviews]);

  // Don't render while loading or if no reviews
  if (isLoading) {
    return null;
  }

  if (reviews.length === 0) {
    return null;
  }

  const averageScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

  return (
    <ReviewedSubmissionCard
      submission={submission}
      reviewCount={reviews.length}
      averageScore={averageScore}
      onViewDetails={onViewDetails}
    />
  );
};

export default AssignmentsPage;
