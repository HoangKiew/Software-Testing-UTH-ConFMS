import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../redux/api/authApi';
import { tokenUtils } from '../../utils/token';
import { formatApiError } from '../../utils/api-helpers';
import bgUth from '../../assets/bg_uth.svg';
import iconUth from '../../assets/icon_uth.svg';
import imageUth from '../../assets/image-uth.jpg';

const LoginPage = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();
      tokenUtils.setTokens(result.accessToken, result.refreshToken);
      const userRoles = result.user?.roles || [];
      const roleNames = userRoles.map((role: any) =>
        typeof role === 'string' ? role : role?.name || role?.role || role,
      );
      const isChairOrAdmin =
        roleNames.includes('CHAIR') || roleNames.includes('ADMIN');
      const isReviewer = roleNames.includes('REVIEWER');
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isChairOrAdmin) {
        navigate('/conference-setup', { replace: true });
      } else if (isReviewer) {
        navigate('/reviewer', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: unknown) {
      setError(formatApiError(err));
    }
  };

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative z-20">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-8 lg:p-12">
            <div className="mb-8">
              <img src={iconUth} alt="Logo Trường" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Đăng nhập
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
                  className="block text-xl font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  placeholder="Tên đăng nhập"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-xl font-medium text-gray-700 mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/activate-account"
                  className="text-[16px] text-teal-600 hover:text-teal-700 font-medium"
                >
                  Kích hoạt tài khoản
                </Link>
                <Link
                  to="/forgot-password"
                  className="text-[16px] text-teal-600 hover:text-teal-700 font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-teal-600 text-white font-semibold py-3 px-4 cursor-pointer rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </div>

          {/* Right Side*/}
          <div className="hidden lg:flex flex-1 bg-gradient-to-br from-teal-50  to-blue-50 items-center justify-center relative overflow-hidden">
            <img
              className="w-full h-2/3 object-fill rounded-md"
              src={imageUth}
              alt="UTH - Trường Giao Thông Vận Tải TPHCM"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
