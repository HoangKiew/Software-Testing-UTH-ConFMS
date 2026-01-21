export interface CoAuthor {
  name: string;
  email: string;
  affiliation?: string;
}

interface CoAuthorsSectionProps {
  coAuthors: CoAuthor[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof CoAuthor, value: string) => void;
}

const CoAuthorsSection = ({
  coAuthors,
  onAdd,
  onRemove,
  onUpdate,
}: CoAuthorsSectionProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Đồng tác giả</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
        >
          + Thêm đồng tác giả
        </button>
      </div>
      <div className="space-y-4">
        {coAuthors.map((coAuthor, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Đồng tác giả {index + 1}
              </span>
              <button
                onClick={() => onRemove(index)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={coAuthor.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  placeholder="Họ và tên"
                  className="w-full px-3 py-2 border border-teal-500 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={coAuthor.email}
                  onChange={(e) => onUpdate(index, 'email', e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-teal-500 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Tổ chức/ Trường đại học
                </label>
                <input
                  type="text"
                  value={coAuthor.affiliation || ''}
                  onChange={(e) => onUpdate(index, 'affiliation', e.target.value)}
                  placeholder="Tên tổ chức hoặc trường đại học"
                  className="w-full px-3 py-2 border border-teal-500 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoAuthorsSection;


