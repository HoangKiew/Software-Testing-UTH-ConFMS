interface AuthorInfoSectionProps {
  userFullName: string | undefined;
  userEmail: string | undefined;
  authorAffiliation: string;
  onAffiliationChange: (value: string) => void;
}

const AuthorInfoSection = ({
  userFullName,
  userEmail,
  authorAffiliation,
  onAffiliationChange,
}: AuthorInfoSectionProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin tác giả chính</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={userFullName || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={userEmail || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tổ chức/Trường đại học<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={authorAffiliation}
            onChange={(e) => onAffiliationChange(e.target.value)}
            placeholder="Tên trường đại học hoặc tổ chức"
            className="w-full px-4 py-2 border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthorInfoSection;


