interface FileUploadSectionProps {
  filePreview: string | null;
  isEditMode: boolean;
  existingFileUrl?: string;
  hasFile: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const FileUploadSection = ({
  filePreview,
  isEditMode,
  existingFileUrl,
  hasFile,
  onFileChange,
  onDragOver,
  onDrop,
}: FileUploadSectionProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Tải lên file</h2>
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors"
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 mb-2">
              {filePreview || 'hoặc kéo thả file vào đây'}
            </p>
            {isEditMode && existingFileUrl && !hasFile && (
              <div className="mt-2">
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 underline text-sm"
                >
                  Xem file hiện tại
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  (Nếu không chọn file mới, file hiện tại sẽ được giữ nguyên)
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Chỉ chấp nhận file PDF, DOCX, DOC hoặc ZIP, tối đa 20MB
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default FileUploadSection;


