import { memo, useState, useEffect, useRef } from 'react';

interface SubmissionActionsMenuProps {
  submissionId: string;
  fileUrl?: string;
  onDownload: (fileUrl: string) => void;
  onEdit: (submissionId: string) => void;
  onDelete: (submissionId: string) => void;
}

const SubmissionActionsMenu = memo(({
  submissionId,
  fileUrl,
  onDownload,
  onEdit,
  onDelete,
}: SubmissionActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="flex items-center justify-end gap-2" ref={menuRef}>
      {/* Edit Button */}
      <button
        onClick={() => onEdit(submissionId)}
        className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
        style={{ color: '#059669' }}
        title="Chỉnh sửa"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>

      {/* Kebab Menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          title="Thêm tùy chọn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                {fileUrl && (
                  <button
                    onClick={() => {
                      onDownload(fileUrl);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Tải file
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(submissionId);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

SubmissionActionsMenu.displayName = 'SubmissionActionsMenu';

export default SubmissionActionsMenu;
