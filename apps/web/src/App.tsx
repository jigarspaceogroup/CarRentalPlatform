import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GuestGuard } from '@/components/auth/GuestGuard';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardHomePage } from '@/pages/DashboardHomePage';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">This page is under construction.</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <>
      <Routes>
        {/* Guest routes (auth pages) */}
        <Route element={<GuestGuard />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected routes (dashboard) */}
        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="bookings" element={<Placeholder title="Bookings" />} />
            <Route path="fleet" element={<Placeholder title="Fleet" />} />
            <Route path="categories" element={<Placeholder title="Categories" />} />
            <Route path="branches" element={<Placeholder title="Branches" />} />
            <Route path="customers" element={<Placeholder title="Customers" />} />
            <Route path="payments" element={<Placeholder title="Payments" />} />
            <Route path="maintenance" element={<Placeholder title="Maintenance" />} />
            <Route path="support" element={<Placeholder title="Support" />} />
            <Route path="pricing" element={<Placeholder title="Pricing" />} />
            <Route path="analytics" element={<Placeholder title="Analytics" />} />
            <Route path="campaigns" element={<Placeholder title="Campaigns" />} />
            <Route path="staff" element={<Placeholder title="Staff" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
            <Route path="configuration" element={<Placeholder title="Configuration" />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
