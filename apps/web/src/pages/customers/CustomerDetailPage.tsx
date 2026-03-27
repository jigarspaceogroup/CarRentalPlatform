import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MessageSquare,
  Send,
  Clock,
  Ban,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';
import {
  useCustomerDetail,
  updateCustomerStatus,
  addCustomerNote,
  type CustomerBooking,
} from '@/hooks/useCustomerDetail';
import type { CustomerStatus } from '@/hooks/useCustomers';

function getCustomerStatusVariant(status: CustomerStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'SUSPENDED':
      return 'yellow';
    case 'BANNED':
      return 'red';
    default:
      return 'gray';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getBookingStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'CONFIRMED':
    case 'VEHICLE_PREPARING':
    case 'READY_FOR_PICKUP':
      return 'blue';
    case 'ACTIVE_RENTAL':
      return 'purple';
    case 'COMPLETED':
      return 'green';
    case 'CANCELLED':
    case 'REJECTED':
      return 'red';
    default:
      return 'gray';
  }
}

export function CustomerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, isLoading, refetch } = useCustomerDetail(id);

  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setIsAddingNote(true);
    try {
      await addCustomerNote(id, newNote.trim());
      toast.success(t('customers.noteAdded'));
      setNewNote('');
      refetch();
    } catch {
      toast.error(t('customers.noteAddFailed'));
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="h-5 w-5 animate-spin text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-gray-900">{t('customers.customerNotFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4" />
          {t('customers.backToCustomers')}
        </Button>
      </div>
    );
  }

  const bookingColumns: TableColumn<CustomerBooking>[] = [
    {
      key: 'referenceNumber',
      header: t('bookings.reference'),
      render: (row) => (
        <button
          onClick={() => navigate(`/bookings/${row.id}`)}
          className="font-medium text-primary-600 hover:underline"
        >
          #{row.referenceNumber}
        </button>
      ),
    },
    {
      key: 'vehicle',
      header: t('bookings.vehicle'),
      render: (row) => (
        <span className="text-sm text-gray-900">
          {row.vehicle.make} {row.vehicle.model} {row.vehicle.year}
        </span>
      ),
    },
    {
      key: 'pickupDate',
      header: t('bookings.pickupDate'),
      render: (row) => <span className="text-sm text-gray-600">{formatDate(row.pickupDate)}</span>,
    },
    {
      key: 'dropoffDate',
      header: t('bookings.dropoffDate'),
      render: (row) => <span className="text-sm text-gray-600">{formatDate(row.dropoffDate)}</span>,
    },
    {
      key: 'totalAmount',
      header: t('bookings.totalAmount'),
      render: (row) => (
        <span className="font-medium text-gray-900">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <Badge variant={getBookingStatusVariant(row.status)}>
          {t(`bookings.status${row.status}`)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {customer.firstName} {customer.lastName}
              </h1>
              <Badge variant={getCustomerStatusVariant(customer.status)}>
                {t(`customers.status${customer.status}`)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {t('customers.registeredOn', { date: formatDate(customer.createdAt) })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {customer.status === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuspendModal(true)}
              >
                <AlertTriangle className="h-4 w-4" />
                {t('customers.suspendAccount')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBanModal(true)}
              >
                <Ban className="h-4 w-4" />
                {t('customers.banAccount')}
              </Button>
            </>
          )}
          {customer.status === 'SUSPENDED' && (
            <>
              <Button
                size="sm"
                onClick={() => setShowReactivateModal(true)}
              >
                <CheckCircle className="h-4 w-4" />
                {t('customers.reactivateAccount')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBanModal(true)}
              >
                <Ban className="h-4 w-4" />
                {t('customers.banAccount')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('customers.customerInfo')}
            </h2>
            <div className="flex items-start gap-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                {customer.photoUrl ? (
                  <img
                    src={customer.photoUrl}
                    alt={`${customer.firstName} ${customer.lastName}`}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Details */}
              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label={t('customers.name')}
                  value={`${customer.firstName} ${customer.lastName}`}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label={t('customers.email')}
                  value={customer.email}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label={t('customers.phone')}
                  value={customer.phone}
                />
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label={t('customers.drivingLicense')}
                  value={customer.drivingLicense}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('customers.registrationDate')}
                  value={formatDate(customer.createdAt)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label={t('customers.lastLogin')}
                  value={customer.lastLogin ? formatDateTime(customer.lastLogin) : t('customers.neverLoggedIn')}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard
              label={t('customers.totalBookings')}
              value={customer.stats.totalBookings.toString()}
              variant="blue"
            />
            <StatCard
              label={t('customers.totalSpent')}
              value={formatCurrency(customer.stats.totalSpent)}
              variant="green"
            />
            <StatCard
              label={t('customers.activeBookings')}
              value={customer.stats.activeBookings.toString()}
              variant="purple"
            />
            <StatCard
              label={t('customers.cancelledBookings')}
              value={customer.stats.cancelledBookings.toString()}
              variant="red"
            />
          </div>

          {/* Booking History */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('customers.bookingHistory')}
            </h2>
            {customer.bookings.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">{t('customers.noBookings')}</p>
            ) : (
              <Table
                columns={bookingColumns}
                data={customer.bookings}
                keyExtractor={(row) => row.id}
                emptyMessage={t('customers.noBookings')}
              />
            )}
          </div>
        </div>

        {/* Right Column: Notes */}
        <div className="space-y-6">
          {/* Internal Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MessageSquare className="h-5 w-5" />
              {t('customers.internalNotes')}
            </h2>

            {/* Add Note */}
            <div className="mb-4 flex gap-2">
              <Textarea
                placeholder={t('customers.addNotePlaceholder')}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                isLoading={isAddingNote}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Notes List */}
            {customer.notes.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">{t('customers.noNotes')}</p>
            ) : (
              <div className="space-y-3">
                {customer.notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                      {note.createdBy && (
                        <span className="font-medium">
                          {note.createdBy.firstName} {note.createdBy.lastName}
                        </span>
                      )}
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SuspendModal
        open={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        customerId={customer.id}
        customerName={`${customer.firstName} ${customer.lastName}`}
        onSuccess={refetch}
      />

      <ReactivateModal
        open={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        customerId={customer.id}
        customerName={`${customer.firstName} ${customer.lastName}`}
        onSuccess={refetch}
      />

      <BanModal
        open={showBanModal}
        onClose={() => setShowBanModal(false)}
        customerId={customer.id}
        customerName={`${customer.firstName} ${customer.lastName}`}
        onSuccess={refetch}
      />
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'blue' | 'green' | 'purple' | 'red';
}) {
  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    red: 'bg-red-50',
  };
  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    red: 'text-red-700',
  };

  return (
    <div className={`rounded-lg ${bgColors[variant]} p-4`}>
      <p className="text-xs text-gray-600">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${textColors[variant]}`}>{value}</p>
    </div>
  );
}

// ─── Status Change Modals ────────────────────────────────────────────────────

interface StatusModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSuccess: () => void;
}

function SuspendModal({ open, onClose, customerId, customerName, onSuccess }: StatusModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonOptions: SelectOption[] = [
    { value: '', label: t('customers.selectReason') },
    { value: 'POLICY_VIOLATION', label: t('customers.reasonPolicyViolation') },
    { value: 'PAYMENT_ISSUE', label: t('customers.reasonPaymentIssue') },
    { value: 'FRAUD_SUSPICION', label: t('customers.reasonFraudSuspicion') },
    { value: 'OTHER', label: t('customers.reasonOther') },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t('customers.reasonRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCustomerStatus(customerId, 'SUSPENDED', reason, note || undefined);
      toast.success(t('customers.customerSuspended'));
      onSuccess();
      onClose();
      setReason('');
      setNote('');
    } catch {
      toast.error(t('customers.suspendFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('customers.suspendAccount')}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('customers.suspendConfirm', { name: customerName })}
        </p>

        <Select
          label={t('customers.reason')}
          options={reasonOptions}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <Textarea
          label={t('customers.note')}
          placeholder={t('customers.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!reason}
          >
            {t('customers.suspendAccount')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ReactivateModal({ open, onClose, customerId, customerName, onSuccess }: StatusModalProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateCustomerStatus(customerId, 'ACTIVE', undefined, note || undefined);
      toast.success(t('customers.customerReactivated'));
      onSuccess();
      onClose();
      setNote('');
    } catch {
      toast.error(t('customers.reactivateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('customers.reactivateAccount')}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('customers.reactivateConfirm', { name: customerName })}
        </p>

        <Textarea
          label={t('customers.note')}
          placeholder={t('customers.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {t('customers.reactivateAccount')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BanModal({ open, onClose, customerId, customerName, onSuccess }: StatusModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t('customers.reasonRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCustomerStatus(customerId, 'BANNED', reason, note || undefined);
      toast.success(t('customers.customerBanned'));
      onSuccess();
      onClose();
      setReason('');
      setNote('');
    } catch {
      toast.error(t('customers.banFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('customers.banAccount')}>
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {t('customers.banWarning')}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {t('customers.banPermanent')}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {t('customers.banConfirm', { name: customerName })}
        </p>

        <Textarea
          label={t('customers.reason')}
          placeholder={t('customers.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          required
        />

        <Textarea
          label={t('customers.note')}
          placeholder={t('customers.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!reason}
          >
            {t('customers.banAccount')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
