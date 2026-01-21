import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetConferencesQuery } from '../../redux/api/conferencesApi';
import ConferenceCard from '../../components/student/ConferenceCard';
import type { Conference } from '../../types/api.types';

const StudentSubmissionLanding = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetConferencesQuery();
  const conferences: Conference[] = data?.data || [];
  const [expandedConference, setExpandedConference] = useState<number | null>(null);

  const isConferenceOpenForSubmission = (c: Conference): boolean => {
    const now = new Date();
    const submissionDeadline = c.cfpSetting?.submissionDeadline || c.submissionDeadline;
    const conferenceStartDate = new Date(c.startDate);

    if (!submissionDeadline) {
      return false;
    }

    const submissionDate = new Date(submissionDeadline);
    return now >= conferenceStartDate && now < submissionDate;
  };

  // Auto-close expanded conference if it becomes closed
  useEffect(() => {
    if (expandedConference !== null) {
      const conference = conferences.find((c) => c.id === expandedConference);
      if (conference && !isConferenceOpenForSubmission(conference)) {
        setExpandedConference(null);
      }
    }
  }, [conferences, expandedConference]);

  if (isLoading)
    return (
      <div className="p-6 flex justify-center items-center">
        <CircularProgress disableShrink />
      </div>
    );
  if (error) return <div className="p-6 text-red-600">Lỗi tải dữ liệu</div>;

  const handleSubmit = (conferenceId: number, trackId?: number) => {
    const conference = conferences.find((c) => c.id === conferenceId);
    if (!conference || !isConferenceOpenForSubmission(conference)) {
      return; // Don't navigate if conference is closed
    }
    if (trackId) {
      navigate(`/student/submit?conferenceId=${conferenceId}&trackId=${trackId}`);
    } else {
      navigate(`/student/submit?conferenceId=${conferenceId}`);
    }
  };

  const handleToggle = (conferenceId: number) => {
    const conference = conferences.find((c) => c.id === conferenceId);
    if (!conference || !isConferenceOpenForSubmission(conference)) {
      // Don't allow toggle if conference is closed
      if (expandedConference === conferenceId) {
        setExpandedConference(null); // Close if already expanded
      }
      return;
    }
    setExpandedConference(expandedConference === conferenceId ? null : conferenceId);
  };

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Danh Sách Cuộc Thi Nghiên Cứu</h1>
        <p className="text-gray-600 mb-6 text-center text-lg">
          Chọn cuộc thi và chủ đề để nộp bài.
        </p>

        <div className="border-2 border-solid border-teal-200 rounded-lg p-5 space-y-5">
          {conferences.map((c) => (
            <ConferenceCard
              key={c.id}
              conference={c}
              isExpanded={expandedConference === c.id}
              onToggle={() => handleToggle(c.id)}
              onSubmit={handleSubmit}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentSubmissionLanding;
