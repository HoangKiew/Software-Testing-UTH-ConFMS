import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetMySubmissionsQuery,
  useWithdrawSubmissionMutation,
} from '../../redux/api/submissionsApi';
import { useGetConferencesQuery, useGetPublicTracksQuery } from '../../redux/api/conferencesApi';
import { formatApiError } from '../../utils/api-helpers';
import { showToast } from '../../utils/toast';
import { tokenUtils } from '../../utils/token';
import SubmissionCard from './SubmissionCard';
import { getStatusLabel, getStatusColor } from '../../utils/submissionListUtils';
import type { Submission, Track } from '../../types/api.types';

const StudentSubmissionsList = () => {
  const navigate = useNavigate();
  const hasToken = tokenUtils.hasToken();
  const { data: submissionsData, isLoading } = useGetMySubmissionsQuery(undefined, {
    skip: !hasToken,
  });
  const { data: conferencesData } = useGetConferencesQuery(undefined, {
    skip: !hasToken,
  });
  const [withdrawSubmission, { isLoading: isWithdrawing }] = useWithdrawSubmissionMutation();

  const submissions: Submission[] = submissionsData?.data || [];
  const conferences = conferencesData?.data || [];

  const conferenceIds = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.conferenceId).filter(Boolean))) as number[],
    [submissions],
  );
  const firstConferenceId = conferenceIds[0];
  const { data: firstConferenceTracksData } = useGetPublicTracksQuery(firstConferenceId || 0, {
    skip: !firstConferenceId,
  });

  const tracksMap = useMemo(() => {
    const map = new Map<number, string>();
    if (firstConferenceId && firstConferenceTracksData?.data) {
      firstConferenceTracksData.data.forEach((track: Track) => {
        map.set(track.id, track.name);
      });
    }
    return map;
  }, [firstConferenceId, firstConferenceTracksData]);

  const submittedSubmissions = submissions.filter(
    (s) => s.status !== 'DRAFT' && s.status !== 'WITHDRAWN',
  );

  const getConferenceName = (conferenceId: number): string => {
    const conference = conferences.find((c) => c.id === conferenceId);
    return conference?.name || `Conference #${conferenceId}`;
  };

  const getTrackName = (conferenceId: number, trackId: number): string => {
    if (conferenceId === firstConferenceId) {
      return tracksMap.get(trackId) || `Track #${trackId}`;
    }
    return `Track #${trackId}`;
  };

  const handleEdit = (submission: Submission) => {
    navigate(
      `/student/submit?conferenceId=${submission.conferenceId}&trackId=${submission.trackId}&submissionId=${submission.id}`,
    );
  };

  const handleDelete = async (submission: Submission) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa/rút bài này không?')) {
      return;
    }

    try {
      await withdrawSubmission(submission.id).unwrap();
      showToast.success('Đã xóa/rút bài thành công');
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return null; // Don't show anything if no submissions
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Submitted Submissions */}
      {submittedSubmissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Bài đã nộp</h2>
          <div className="space-y-4 border border-solid border-border rounded-lg p-4">
            {submittedSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                conferenceName={getConferenceName(submission.conferenceId)}
                trackName={getTrackName(submission.conferenceId, submission.trackId)}
                statusLabel={getStatusLabel(submission.status)}
                statusColor={getStatusColor(submission.status)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isWithdrawing={isWithdrawing}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionsList;

