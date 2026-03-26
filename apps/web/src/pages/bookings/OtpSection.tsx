import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, RefreshCw, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useOtpAdmin } from '@/hooks/useOtpAdmin';
import { formatDateTime } from '@/pages/bookings/bookingUtils';
import toast from 'react-hot-toast';

interface OtpSectionProps {
  bookingId: string;
  bookingStatus: string;
}

export function OtpSection({ bookingId, bookingStatus }: OtpSectionProps) {
  const { t } = useTranslation();
  const { activeOtp, auditLog, fetchOtpStatus, generateOtp } = useOtpAdmin(bookingId);
  const [channel, setChannel] = useState('BOTH');
  const [isGenerating, setIsGenerating] = useState(false);

  const showOtpSection = ['READY_FOR_PICKUP', 'ACTIVE_RENTAL', 'RETURN_PENDING', 'COMPLETED'].includes(bookingStatus);

  useEffect(() => {
    if (showOtpSection) fetchOtpStatus();
  }, [showOtpSection, fetchOtpStatus]);

  if (!showOtpSection) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateOtp(channel);
      toast.success(t('otp.generateSuccess'));
    } catch {
      toast.error(t('otp.generateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'GENERATED': return 'blue' as const;
      case 'DELIVERED': return 'green' as const;
      case 'USED': return 'gray' as const;
      case 'EXPIRED': return 'yellow' as const;
      case 'INVALIDATED': return 'red' as const;
      default: return 'gray' as const;
    }
  };

  const auditColumns: TableColumn<any>[] = [
    { key: 'code', header: t('otp.code'), render: (row) => <code className="font-mono text-sm">{row.code}</code> },
    { key: 'status', header: t('common.status'), render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'channel', header: t('otp.channel'), render: (row) => <span className="text-sm text-gray-600">{row.channel}</span> },
    { key: 'generatedBy', header: t('otp.generatedBy'), render: (row) => row.generatedByStaff ? <span className="text-sm">{row.generatedByStaff.firstName} {row.generatedByStaff.lastName}</span> : <span className="text-gray-400">System</span> },
    { key: 'date', header: t('common.date'), render: (row) => <span className="text-sm text-gray-600">{formatDateTime(row.createdAt)}</span> },
    { key: 'expiry', header: t('otp.expiresAt'), render: (row) => <span className="text-sm text-gray-600">{formatDateTime(row.expiresAt)}</span> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Key className="h-5 w-5" />
          {t('otp.management')}
        </h2>
      </div>

      {/* Current OTP */}
      {activeOtp && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('otp.currentCode')}</p>
              <p className="mt-1 font-mono text-3xl font-bold text-gray-900">{activeOtp.code}</p>
            </div>
            <Badge variant={getStatusVariant(activeOtp.status)} className="text-base px-3 py-1">{activeOtp.status}</Badge>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {t('otp.expiresAt')}: {formatDateTime(activeOtp.expiresAt)}</span>
            <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> {activeOtp.channel}</span>
          </div>
        </div>
      )}

      {/* Generate controls */}
      <div className="flex items-end gap-3">
        <div className="w-40">
          <Select
            label={t('otp.channel')}
            options={[
              { value: 'BOTH', label: 'SMS + Push' },
              { value: 'SMS', label: 'SMS Only' },
              { value: 'PUSH', label: 'Push Only' },
            ]}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
        </div>
        <Button onClick={handleGenerate} isLoading={isGenerating} size="sm">
          <RefreshCw className="h-4 w-4" />
          {t('otp.generateNew')}
        </Button>
      </div>

      {/* Audit log */}
      {auditLog.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">{t('otp.auditLog')}</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Table columns={auditColumns} data={auditLog} keyExtractor={(row) => row.id} />
          </div>
        </div>
      )}
    </div>
  );
}
