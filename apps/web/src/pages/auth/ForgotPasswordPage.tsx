import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Globe, Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const { forgotPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentLang = i18n.language;
  const isRtl = currentLang === 'ar';

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

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
    } catch {
      // We still show success to not reveal whether email exists
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

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
          </div>

          {isSubmitted ? (
            // Success state
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('auth.checkYourEmail')}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {t('auth.resetLinkSent')}
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                <ArrowLeft className={isRtl ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            // Form state
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('auth.forgotPasswordTitle')}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {t('auth.forgotPasswordSubtitle')}
                </p>
              </div>

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

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {t('auth.sendResetLink')}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
