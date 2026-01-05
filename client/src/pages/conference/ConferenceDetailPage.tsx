import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    CalendarMonth,
    Category,
    ArrowBack,
    CheckCircle
} from '@mui/icons-material';

interface Conference {
    id: number;
    name: string;
    shortName: string;
    deadline: string;
    topics: string[];
    status: 'Open' | 'Closing Soon' | 'Closed';
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    importantDates: { event: string; date: string }[];
    guidelines: string[];
}

const ConferenceDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Mock data
    const conferences: Conference[] = [
        {
            id: 1,
            name: 'International Conference on Computer Science 2026',
            shortName: 'ICCS 2026',
            deadline: '2026-03-15',
            topics: ['Machine Learning', 'AI', 'Data Science', 'Computer Vision', 'NLP'],
            status: 'Open',
            description: 'The International Conference on Computer Science (ICCS) is a premier forum for presenting and discussing the most recent innovations, trends, and concerns in the field of computer science.',
            location: 'Ho Chi Minh City, Vietnam',
            startDate: '2026-06-15',
            endDate: '2026-06-17',
            importantDates: [
                { event: 'Paper Submission Deadline', date: '2026-03-15' },
                { event: 'Notification of Acceptance', date: '2026-04-20' },
                { event: 'Camera-ready Submission', date: '2026-05-10' },
                { event: 'Conference Dates', date: '2026-06-15 - 2026-06-17' }
            ],
            guidelines: [
                'Papers must be original and not previously published',
                'Maximum length: 8 pages (including references)',
                'Format: IEEE conference template',
                'Language: English',
                'Submissions must be in PDF format',
                'All papers will undergo double-blind peer review'
            ]
        },
        {
            id: 2,
            name: 'Vietnam Software Engineering Conference 2026',
            shortName: 'VSEC 2026',
            deadline: '2026-02-28',
            topics: ['Software Engineering', 'DevOps', 'Cloud Computing', 'Agile', 'Testing'],
            status: 'Closing Soon',
            description: 'VSEC is Vietnam\'s leading conference on software engineering practices, bringing together researchers and practitioners to share knowledge and experiences.',
            location: 'Hanoi, Vietnam',
            startDate: '2026-05-20',
            endDate: '2026-05-22',
            importantDates: [
                { event: 'Paper Submission Deadline', date: '2026-02-28' },
                { event: 'Notification of Acceptance', date: '2026-03-30' },
                { event: 'Camera-ready Submission', date: '2026-04-20' },
                { event: 'Conference Dates', date: '2026-05-20 - 2026-05-22' }
            ],
            guidelines: [
                'Papers must be original research or case studies',
                'Maximum length: 6 pages',
                'Format: ACM conference template',
                'Language: English or Vietnamese',
                'PDF format required'
            ]
        }
    ];

    const conference = conferences.find(c => c.id === parseInt(id || '0'));

    if (!conference) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Không tìm thấy hội nghị
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Hội nghị bạn đang tìm kiếm không tồn tại.
                    </p>
                    <Link
                        to="/conferences"
                        className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open':
                return 'bg-green-100 text-green-800';
            case 'Closing Soon':
                return 'bg-yellow-100 text-yellow-800';
            case 'Closed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/conferences')}
                    className="flex items-center text-gray-600 hover:text-[#008689] mb-6 transition-colors"
                >
                    <ArrowBack className="w-5 h-5 mr-2" />
                    Quay lại danh sách hội nghị
                </button>

                {/* Conference Header */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {conference.shortName}
                            </h1>
                            <h2 className="text-xl text-gray-700 mb-4">
                                {conference.name}
                            </h2>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(conference.status)}`}>
                            {conference.status === 'Open' ? 'Đang mở' :
                                conference.status === 'Closing Soon' ? 'Sắp đóng' : 'Đã đóng'}
                        </span>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {conference.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center text-gray-700">
                            <CalendarMonth className="w-5 h-5 mr-3 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Ngày tổ chức</p>
                                <p className="font-medium">
                                    {new Date(conference.startDate).toLocaleDateString('vi-VN')} - {new Date(conference.endDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                            <CalendarMonth className="w-5 h-5 mr-3 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Deadline nộp bài</p>
                                <p className="font-medium">
                                    {new Date(conference.deadline).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                            <CalendarMonth className="w-5 h-5 mr-3 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Địa điểm</p>
                                <p className="font-medium">{conference.location}</p>
                            </div>
                        </div>
                    </div>

                    {conference.status !== 'Closed' && (
                        <Link
                            to="/submission"
                            className="inline-block w-full md:w-auto px-8 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors duration-200 text-center"
                        >
                            Nộp bài cho hội nghị này
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Topics */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Category className="w-6 h-6 mr-2 text-[#008689]" />
                                Topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {conference.topics.map(topic => (
                                    <span
                                        key={topic}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Submission Guidelines */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="w-6 h-6 mr-2 text-[#008689]" />
                                Submission Guidelines
                            </h3>
                            <ul className="space-y-3">
                                {conference.guidelines.map((guideline, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="inline-block w-2 h-2 bg-[#008689] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span className="text-gray-700">{guideline}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Important Dates */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CalendarMonth className="w-6 h-6 mr-2 text-[#008689]" />
                                Important Dates
                            </h3>
                            <div className="space-y-4">
                                {conference.importantDates.map((item, index) => (
                                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-0 last:pb-0">
                                        <div className="absolute left-0 top-0 w-3 h-3 bg-[#008689] rounded-full -translate-x-[7px]"></div>
                                        <p className="font-medium text-gray-900 text-sm mb-1">
                                            {item.event}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {item.date.includes('-') && item.date.split('-').length === 3
                                                ? new Date(item.date).toLocaleDateString('vi-VN')
                                                : item.date}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConferenceDetailPage;
