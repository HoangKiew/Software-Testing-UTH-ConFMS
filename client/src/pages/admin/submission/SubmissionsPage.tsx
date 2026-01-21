import { useState, useMemo, useCallback } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionsQuery } from '../../../redux/api/submissionsApi';
import {
  useGetConferencesQuery,
  useGetTracksQuery,
} from '../../../redux/api/conferencesApi';
import type { SubmissionStatus } from '../../../types/api.types';
import { formatApiError } from '../../../utils/api-helpers';
import SubmissionsFilters from '../../../components/admin/submission/SubmissionsFilters';
import SubmissionsTable from '../../../components/admin/submission/SubmissionsTable';

const SubmissionsPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SubmissionStatus | ''>(
    '',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch conferences
  const { data: conferencesData, isLoading: conferencesLoading } =
    useGetConferencesQuery();

  // Fetch tracks for selected conference
  const { data: tracksData, isLoading: tracksLoading } = useGetTracksQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId },
  );

  // Fetch submissions with filters
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useGetSubmissionsQuery({
    conferenceId: selectedConferenceId || undefined,
    trackId: selectedTrackId || undefined,
    status: selectedStatus || undefined,
    search: searchQuery || undefined,
    page,
    limit,
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

  const submissions = useMemo(() => {
    return submissionsData?.data && Array.isArray(submissionsData.data)
      ? submissionsData.data
      : [];
  }, [submissionsData]);

  // Filter submissions to only show SUBMITTED and WITHDRAWN
  const filteredSubmissions = useMemo(() => {
    if (!selectedStatus) {
      return submissions.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'WITHDRAWN',
      );
    }
    if (selectedStatus === 'SUBMITTED' || selectedStatus === 'WITHDRAWN') {
      return submissions.filter((s) => s.status === selectedStatus);
    }
    return [];
  }, [submissions, selectedStatus]);

  const pagination = submissionsData?.pagination;

  const hasFilters = Boolean(
    selectedConferenceId || selectedTrackId || selectedStatus || searchQuery,
  );

  const handleConferenceChange = useCallback((conferenceId: number | null) => {
    setSelectedConferenceId(conferenceId);
    setSelectedTrackId(null);
    setPage(1);
  }, []);

  const handleTrackChange = useCallback((trackId: number | null) => {
    setSelectedTrackId(trackId);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((status: SubmissionStatus | '') => {
    setSelectedStatus(status);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Main Content Container */}
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách bài nộp
          </h1>
        </div>

        {/* Filters Card */}
        <SubmissionsFilters
          conferences={conferences}
          tracks={tracks}
          selectedConferenceId={selectedConferenceId}
          selectedTrackId={selectedTrackId}
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          onConferenceChange={handleConferenceChange}
          onTrackChange={handleTrackChange}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
        />

        {/* Loading */}
        {(conferencesLoading || tracksLoading || submissionsLoading) && (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="flex justify-center items-center">
              <CircularProgress disableShrink />
            </div>
          </div>
        )}

        {/* Error */}
        {submissionsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{formatApiError(submissionsError)}</p>
          </div>
        )}

        {/* Submissions Table Card */}
        {!conferencesLoading && !submissionsLoading && !submissionsError && (
          <SubmissionsTable
            submissions={filteredSubmissions}
            tracks={tracks}
            pagination={pagination}
            currentPage={page}
            onPageChange={handlePageChange}
            hasFilters={hasFilters}
          />
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;
