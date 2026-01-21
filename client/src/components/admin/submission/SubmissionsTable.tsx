import { memo, useMemo } from 'react';
import type { Submission } from '../../../types/api.types';
import type { Track } from '../../../types/api.types';
import SubmissionRow from './SubmissionRow';
import PaginationControls from './PaginationControls';

interface SubmissionsTableProps {
  submissions: Submission[];
  tracks: Track[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  currentPage: number;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
}

const SubmissionsTable = memo(({
  submissions,
  tracks,
  pagination,
  currentPage,
  onPageChange,
  hasFilters,
}: SubmissionsTableProps) => {
  const getTrackName = useMemo(
    () => (trackId: number): string => {
      const track = tracks.find((t) => t.id === trackId);
      return track ? track.name : `Track: ${trackId}`;
    },
    [tracks],
  );

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách bài nộp
            {pagination && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({pagination.total} bài)
              </span>
            )}
          </h2>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <p className="text-lg">Không có bài nộp nào được tìm thấy.</p>
          {!hasFilters && (
            <p className="mt-2 text-sm">
              Vui lòng chọn hội nghị hoặc chủ đề để xem bài nộp.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[300px]">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[200px]">
                    Tác giả
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[250px]">
                    Chủ đề
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[120px]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[140px]">
                    Ngày nộp
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[150px]">
                    Xem bài nộp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <SubmissionRow
                    key={submission.id}
                    submission={submission}
                    trackName={getTrackName(submission.trackId)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
});

SubmissionsTable.displayName = 'SubmissionsTable';

export default SubmissionsTable;
