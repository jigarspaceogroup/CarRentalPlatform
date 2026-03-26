import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface OtpRecord {
  id: string;
  code: string;
  status: string;
  channel: string;
  deliveredAt?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
  generatedByStaff?: { firstName: string; lastName: string };
}

export function useOtpAdmin(bookingId?: string) {
  const [activeOtp, setActiveOtp] = useState<OtpRecord | null>(null);
  const [auditLog, setAuditLog] = useState<OtpRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOtpStatus = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/bookings/${bookingId}/otp`);
      setActiveOtp(res.data.data.activeOtp);
      setAuditLog(res.data.data.auditLog);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  const generateOtp = useCallback(
    async (channel: string = 'BOTH') => {
      if (!bookingId) return;
      setIsLoading(true);
      try {
        const res = await api.post(`/admin/bookings/${bookingId}/otp/generate`, {
          channel,
        });
        await fetchOtpStatus();
        return res.data.data;
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [bookingId, fetchOtpStatus],
  );

  return { activeOtp, auditLog, isLoading, fetchOtpStatus, generateOtp };
}
