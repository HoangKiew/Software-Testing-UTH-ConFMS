import { useState, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import type { ReviewAssignment, Submission } from '../../types/api.types';

interface SubmissionListProps {
  assignments: ReviewAssignment[];
  onEvaluate: (submissionId: string, assignmentId: number) => void;
}

const SubmissionList = ({ assignments, onEvaluate }: SubmissionListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const visibleAssignments = assignments.filter((a) => a.status !== 'REJECTED');
  const submissionsWithAssignments = useMemo(() => {
    return visibleAssignments.map((assignment) => {
      if (assignment.submission) {
        return { submission: assignment.submission, assignment };
      }
      return { submission: null, assignment };
    });
  }, [visibleAssignments]);

  const searchedItems = submissionsWithAssignments.filter((item) => {
    if (!item.submission) return true; // Include items that are still loading
    return (
      searchTerm === '' ||
      item.submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.submission.abstract.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (visibleAssignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Chưa có bài nộp nào
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {searchedItems.map((item) => (
          <SubmissionItem
            key={item.assignment.id}
            assignment={item.assignment}
            submission={item.submission}
            onEvaluate={onEvaluate}
          />
        ))}
      </div>
    </div>
  );
};

interface SubmissionItemProps {
  assignment: ReviewAssignment;
  submission: Submission | null;
  onEvaluate: (submissionId: string, assignmentId: number) => void;
}

const SubmissionItem = ({ assignment, submission, onEvaluate }: SubmissionItemProps) => {
  const { data: submissionData } = useGetSubmissionByIdQuery(assignment.submissionId, {
    skip: !!submission,
  });

  const finalSubmission = submission || submissionData?.data;

  if (!finalSubmission) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  // Determine status text and class
  let status = 'Chưa phân công';
  let statusClass = 'bg-gray-200 text-gray-700';
  
  if (assignment.status === 'ACCEPTED') {
    status = 'Đã phân công';
    statusClass = 'bg-green-600 text-white';
  } else if (assignment.status === 'PENDING') {
    status = 'Chờ chấp nhận';
    statusClass = 'bg-yellow-500 text-white';
  } else if (assignment.status === 'COMPLETED') {
    status = 'Đã hoàn thành';
    statusClass = 'bg-blue-600 text-white';
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {finalSubmission.id}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${statusClass}`}>
              {status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {finalSubmission.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Tác giả: {finalSubmission.authorName || 'N/A'}
          </p>
          {finalSubmission.keywords && (
            <div className="flex flex-wrap gap-2 mt-2">
              {finalSubmission.keywords.split(',').map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEvaluate(finalSubmission.id, assignment.id)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Thủ công
          </button>
          <button
            onClick={() => onEvaluate(finalSubmission.id, assignment.id)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Tự động
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;

