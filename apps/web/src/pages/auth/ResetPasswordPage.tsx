import { useState, useMemo, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Globe, Car, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/cn';

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  score: number;
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;

  return { hasMinLength, hasUppercase, hasLowercase, hasNumber, score };
}

function getStrengthLabel(score: number, t: (key: string) => string): string {
  switch (score) {
    case 0:
    case 1:
      return t('auth.strengthWeak');
    case 2:
      return t('auth.strengthFair');
    case 3:
      return t('auth.strengthGood');
    case 4:
      return t('auth.strengthStrong');
    default:
      return '';
  }
}

function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-200';
  }
}

export function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuthStore();

  const resetToken = searchParams.get('token');
  const currentLang = i18n.language;
  const isRtl = currentLang === 'ar';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const toggleLanguage = () => {
    const next = currentLang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
  };

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const passwordError = useMemo(() => {
    if (!submitted) return undefined;
    if (!password) return t('auth.passwordRequired');
    if (strength.score < 4) return t('auth.passwordTooWeak');
    return undefined;
  }, [submitted, password, strength.score, t]);

  const confirmPasswordError = useMemo(() => {
    if (!submitted) return undefined;
    if (!confirmPassword) return t('auth.confirmPasswordRequired');
    if (password !== confirmPassword) return t('auth.passwordsDoNotMatch');
    return undefined;
  }, [submitted, confirmPassword, password, t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);

    if (strength.score < 4 || password !== confirmPassword || !password || !confirmPassword) {
      return;
    }

    if (!resetToken) {
      setApiError(t('auth.invalidToken'));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetToken, password);
      toast.success(t('auth.resetSuccess'));
      navigate('/login', { replace: true });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 400 || axiosError.response?.status === 404) {
          setApiError(t('auth.invalidToken'));
        } else {
          setApiError(axiosError.response?.data?.message || t('auth.resetFailed'));
        }
      } else {
        setApiError(t('auth.resetFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // No token in URL
  if (!resetToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white px-8 py-10 text-center shadow-lg ring-1 ring-gray-100">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('auth.invalidToken')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('auth.invalidTokenDescription')}</p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              {t('auth.requestNewLink')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Language toggle */}
      <div className="fixed end-4 top-4 z-10">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 hover:text-gray-900"
          aria-label={t('auth.toggleLanguage')}
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{currentLang === 'en' ? 'AR' : 'EN'}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-100">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md">
              <Car className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {t('auth.resetPassword')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{t('auth.resetPasswordSubtitle')}</p>
          </div>

          {/* API error */}
          {apiError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {apiError}
              {apiError === t('auth.invalidToken') && (
                <Link
                  to="/forgot-password"
                  className="ms-1 font-medium underline hover:text-red-800"
                >
                  {t('auth.requestNewLink')}
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* New Password */}
            <div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.newPassword')}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError}
                  autoComplete="new-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute end-3 top-[38px] text-gray-400 transition-colors hover:text-gray-600"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            strength.score >= level
                              ? getStrengthColor(strength.score)
                              : 'bg-gray-200',
                          )}
                        />
                      ))}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        strength.score <= 1 && 'text-red-600',
                        strength.score === 2 && 'text-orange-600',
                        strength.score === 3 && 'text-yellow-600',
                        strength.score === 4 && 'text-green-600',
                      )}
                    >
                      {getStrengthLabel(strength.score, t)}
                    </span>
                  </div>

                  {/* Requirement list */}
                  <ul className="space-y-1">
                    {[
                      { met: strength.hasMinLength, label: t('auth.reqMinLength') },
                      { met: strength.hasUppercase, label: t('auth.reqUppercase') },
                      { met: strength.hasLowercase, label: t('auth.reqLowercase') },
                      { met: strength.hasNumber, label: t('auth.reqNumber') },
                    ].map((req) => (
                      <li
                        key={req.label}
                        className={cn(
                          'flex items-center gap-1.5 text-xs',
                          req.met ? 'text-green-600' : 'text-gray-400',
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPasswordError}
                autoComplete="new-password"
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute end-3 top-[38px] text-gray-400 transition-colors hover:text-gray-600"
                aria-label={
                  showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {t('auth.resetPassword')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              <ArrowLeft className={isRtl ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
