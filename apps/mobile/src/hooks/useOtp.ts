import { useState, useCallback } from 'react';
import api from '../lib/api';

interface SignContractResult {
  success: boolean;
  signedAt?: string;
  otpCode?: string;
  otpExpiresAt?: string;
}

interface RequestOtpResult {
  success: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
}

interface UseOtpReturn {
  signContract: (bookingId: string) => Promise<SignContractResult>;
  requestNewOtp: (bookingId: string) => Promise<RequestOtpResult>;
  isLoading: boolean;
}

export function useOtp(): UseOtpReturn {
  const [isLoading, setIsLoading] = useState(false);

  const signContract = useCallback(
    async (bookingId: string): Promise<SignContractResult> => {
      setIsLoading(true);
      try {
        const { data } = await api.post(`/bookings/${bookingId}/contract/sign`);
        const result = data.data ?? data;
        return {
          success: true,
          signedAt: result.signedAt,
          otpCode: result.otpCode,
          otpExpiresAt: result.otpExpiresAt,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to sign contract';
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestNewOtp = useCallback(
    async (bookingId: string): Promise<RequestOtpResult> => {
      setIsLoading(true);
      try {
        const { data } = await api.post(`/bookings/${bookingId}/otp/request-new`);
        const result = data.data ?? data;
        return {
          success: true,
          otpCode: result.otpCode,
          otpExpiresAt: result.otpExpiresAt,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to request new OTP';
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { signContract, requestNewOtp, isLoading };
}
