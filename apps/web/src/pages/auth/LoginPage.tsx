import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Globe, Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/cn';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, isLoading, loginError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const next = currentLang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError(t('auth.emailRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError(t('auth.emailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateEmail(email)) return;
    if (!password.trim()) return;

    try {
      await login({ email: email.trim(), password });
    } catch {
      // Error is captured in the store's loginError state
    }
  };

  const getDisplayError = (): string | null => {
    if (!loginError) return null;
    // If the error is a known i18n key, translate it
    if (loginError === 'auth.tooManyAttempts' || loginError === 'auth.invalidCredentials') {
      return t(loginError);
    }
    // Otherwise return the raw message from the server
    return loginError;
  };

  const displayError = getDisplayError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Language toggle in top corner */}
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
          {/* Logo placeholder */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md">
              <Car className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {t('auth.loginTitle')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Error banner */}
          {displayError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (submitted) validateEmail(e.target.value);
              }}
              error={submitted && emailError ? emailError : undefined}
              autoComplete="email"
              dir="ltr"
            />

            <div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={
                    submitted && !password.trim() ? t('auth.passwordRequired') : undefined
                  }
                  autoComplete="current-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={cn(
                    'absolute end-3 text-gray-400 transition-colors hover:text-gray-600',
                    submitted && !password.trim() ? 'top-[38px]' : 'top-[38px]',
                  )}
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
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {t('auth.loginButton')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          {t('common.appName')}
        </p>
      </div>
    </div>
  );
}
