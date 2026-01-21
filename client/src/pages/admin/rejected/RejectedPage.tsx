import { useState, useMemo, useCallback } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionsQuery } from '../../../redux/api/submissionsApi';
import {
  useGetConferencesQuery,
  useGetTracksQuery,
} from '../../../redux/api/conferencesApi';
import { formatApiError } from '../../../utils/api-helpers';
import SubmissionsFilters from '../../../components/admin/submission/SubmissionsFilters';
import SubmissionsTable from '../../../components/admin/submission/SubmissionsTable';

const RejectedPage = () => {
  const [selectedConferenceId, setSelectedConferenceId] = useState<
    number | null
  >(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: conferencesData, isLoading: conferencesLoading } =
    useGetConferencesQuery();
  const { data: tracksData, isLoading: tracksLoading } = useGetTracksQuery(
    selectedConferenceId!,
    { skip: !selectedConferenceId },
  );
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useGetSubmissionsQuery({
    conferenceId: selectedConferenceId || undefined,
    trackId: selectedTrackId || undefined,
    status: 'REJECTED',
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
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => s.status === 'REJECTED');
  }, [submissions]);

  const pagination = submissionsData?.pagination;

  const hasFilters = Boolean(
    selectedConferenceId || selectedTrackId || searchQuery,
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

  const handleStatusChange = useCallback(() => {
    // Status is always REJECTED, no need to handle change
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
            Bài nộp bị từ chối
          </h1>
        </div>

        {/* Filters Card */}
        <SubmissionsFilters
          conferences={conferences}
          tracks={tracks}
          selectedConferenceId={selectedConferenceId}
          selectedTrackId={selectedTrackId}
          selectedStatus="REJECTED"
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

export default RejectedPage;
