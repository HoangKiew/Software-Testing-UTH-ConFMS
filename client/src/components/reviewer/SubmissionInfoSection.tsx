import { memo } from 'react';
import type { Submission } from '../../types/api.types';

interface SubmissionInfoSectionProps {
  submission: Submission;
}

const SubmissionInfoSection = memo(
  ({ submission }: SubmissionInfoSectionProps) => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {submission.title}
        </h2>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Tác giả:</p>
            <p className="text-gray-600">
              {submission.authorName || `ID: ${submission.authorId}`}
            </p>
            {submission.authorAffiliation && (
              <p className="text-sm text-gray-500 mt-1">
                {submission.authorAffiliation}
              </p>
            )}
          </div>

          {submission.coAuthors && submission.coAuthors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Đồng tác giả:
              </p>
              <div className="space-y-1">
                {submission.coAuthors.map((coAuthor, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    <span className="font-medium">{coAuthor.name}</span>
                    {coAuthor.email && (
                      <span className="text-gray-500"> ({coAuthor.email})</span>
                    )}
                    {coAuthor.affiliation && (
                      <span className="text-gray-500">
                        {' '}
                        - {coAuthor.affiliation}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.abstract && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tóm tắt:</p>
              <p className="text-gray-600 whitespace-pre-wrap">
                {submission.abstract}
              </p>
            </div>
          )}

          {submission.keywords && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Từ khóa:</p>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.split(',').map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {submission.fileUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                File bài nộp:
              </p>
              <button
                onClick={() => window.open(submission.fileUrl, '_blank')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center gap-2"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Tải xuống file PDF
              </button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

SubmissionInfoSection.displayName = 'SubmissionInfoSection';

export default SubmissionInfoSection;
