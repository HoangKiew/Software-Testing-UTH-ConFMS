import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import bgUth from '../../assets/bg_uth.svg';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetVerificationTokenQuery,
  useVerifyEmailMutation,
} from '../../redux/api/authApi';
import { formatApiError } from '../../utils/api-helpers';
import { showToast } from '../../utils/toast';

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmit, setIsSubmit] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Query để lấy verification token (chỉ query khi đã submit email)
  const {
    data: tokenData,
    isLoading: isLoadingToken,
    error: tokenError,
    refetch: refetchToken,
  } = useGetVerificationTokenQuery({ email }, { skip: !isSubmit || !email });

  // Xử lý kết quả query
  useEffect(() => {
    if (tokenData?.data) {
      if (tokenData.data.isVerified) {
        showToast.info('Email đã được xác minh. Bạn có thể đăng nhập ngay.');
        setError('Email đã được xác minh. Bạn có thể đăng nhập ngay.');
        setIsSubmit(false);
      }
    }
    if (tokenError) {
      const errorMessage = formatApiError(tokenError);
      // Kiểm tra nếu là lỗi đã được xác minh
      if (
        errorMessage.includes('đã được xác minh') ||
        errorMessage.includes('đã được xác thực')
      ) {
        showToast.info('Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.');
        setError('Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.');
      } else {
        setError(errorMessage);
      }
      setIsSubmit(false);
    }
  }, [tokenData, tokenError]);

  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    setIsSubmit(true);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.trim().length === 0) {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    try {
      await verifyEmail({ token: code.trim() }).unwrap();

      // Hiển thị toast thông báo thành công
      showToast.success('Kích hoạt tài khoản thành công! Vui lòng đăng nhập.');

      navigate('/login', {
        state: {
          message: 'Kích hoạt tài khoản thành công! Vui lòng đăng nhập.',
        },
      });
    } catch (err: any) {
      // Kiểm tra nếu tài khoản đã được xác thực rồi
      const errorMessage = err?.data?.message || err?.message || '';
      if (
        err?.status === 400 &&
        (errorMessage.includes('đã được xác minh') ||
          errorMessage.includes('đã được xác thực'))
      ) {
        // Hiển thị toast thông báo đã được xác thực
        showToast.info('Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.');
        setError('Tài khoản này đã được xác thực. Bạn có thể đăng nhập ngay.');
      } else {
        setError(formatApiError(err));
      }
    }
  };

  const handleResendCode = async () => {
    setError(null);
    try {
      await refetchToken();
    } catch (err: unknown) {
      setError(formatApiError(err));
    }
  };
  if (isSubmit) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${bgUth})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-20">
          <Link
            to="/login"
            className="text-[16px] text-gray-600 hover:text-gray-800 mb-5 inline-flex items-center "
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="pb-1">Quay lại trang đăng nhập</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác minh mã</h1>
          <p className="text-gray-600 mb-5">
            Mã xác thực đã được gửi đến {email}.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-12"
                  placeholder="759040"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[16px] text-black hover:text-teal-700 font-medium cursor-pointer"
              >
                Bạn chưa nhận được mã?{' '}
                <strong className="text-sm text-red-500 hover:text-teal-700">
                  Gửi lại
                </strong>
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Đang xác thực...' : 'Xác thực'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgUth})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-20">
        <Link
          to="/login"
          className="text-[16px] text-gray-600 hover:text-gray-800 mb-5 inline-flex items-center "
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="pb-1">Quay lại trang đăng nhập</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Kích hoạt tài khoản
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              placeholder="Nhập Email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoadingToken}
            className="w-full bg-primary hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingToken ? (
              <span className="flex items-center gap-2 justify-center">
                <CircularProgress size={16} disableShrink />
                Đang xử lý...
              </span>
            ) : (
              'Xác nhận'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivateAccount;
