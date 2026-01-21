import { memo, useState } from 'react';
import type { Submission } from '../../../types/api.types';
import { getStatusColor, getStatusLabel, formatSubmissionDate } from '../../../utils/submission-helpers';
import SubmissionDetailDropdown from './SubmissionDetailDropdown';

interface SubmissionRowProps {
  submission: Submission;
  trackName: string;
}

const SubmissionRow = memo(({
  submission,
  trackName,
}: SubmissionRowProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <div
            className="text-sm font-medium text-gray-900 break-words"
            title={submission.title}
          >
            {submission.title}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 break-words">
            <div className="font-medium">
              {submission.authorName || `ID: ${submission.authorId}`}
            </div>
            {submission.coAuthors && submission.coAuthors.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Đồng tác giả:</span>{' '}
                {submission.coAuthors.map((ca) => ca.name).join(', ')}
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 break-words">{trackName}</div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              submission.status,
            )}`}
          >
            {getStatusLabel(submission.status)}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-500">
            {formatSubmissionDate(submission.submittedAt || submission.createdAt)}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border ${
                isDropdownOpen
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-transparent text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white'
              }`}
              title="Xem chi tiết bài nộp"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Xem bài nộp
            </button>
            {isDropdownOpen && (
              <SubmissionDetailDropdown
                submissionId={submission.id}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        </td>
      </tr>
    </>
  );
});

SubmissionRow.displayName = 'SubmissionRow';

export default SubmissionRow;
