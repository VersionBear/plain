import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { useFoundersStore } from '../store/useFoundersStore';
import { useOverlayFocus } from '../hooks/useOverlayFocus';

function formatVerificationTimestamp(timestamp) {
  if (!timestamp) {
    return 'Not yet verified';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function FoundersRedeemModal({ isOpen, onClose }) {
  const foundersPackPurchaseUrl =
    'https://versionbear.gumroad.com/l/plain-founder';
  const customerEmail = useFoundersStore((state) => state.customerEmail);
  const customerName = useFoundersStore((state) => state.customerName);
  const errorMessage = useFoundersStore((state) => state.errorMessage);
  const isFoundersPackActive = useFoundersStore(
    (state) => state.isFoundersPackActive,
  );
  const isSubmitting = useFoundersStore((state) => state.isSubmitting);
  const lastVerifiedAt = useFoundersStore((state) => state.lastVerifiedAt);
  const licenseKey = useFoundersStore((state) => state.licenseKey);
  const maskedLicenseKey = useFoundersStore((state) => state.maskedLicenseKey);
  const orderNumber = useFoundersStore((state) => state.orderNumber);
  const clearError = useFoundersStore((state) => state.clearError);
  const clearFoundersAccess = useFoundersStore(
    (state) => state.clearFoundersAccess,
  );
  const redeemLicense = useFoundersStore((state) => state.redeemLicense);
  const refreshLicense = useFoundersStore((state) => state.refreshLicense);
  const [licenseInput, setLicenseInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const dialogRef = useRef(null);
  const hasStoredLicenseKey = Boolean(licenseKey.trim());

  useOverlayFocus({
    isOpen,
    containerRef: dialogRef,
    onClose,
    canClose: !isSubmitting,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLicenseInput(licenseKey);
    setIsEditingKey(!isFoundersPackActive);
    clearError();
  }, [clearError, isFoundersPackActive, isOpen, licenseKey]);

  const verificationLabel = useMemo(
    () => formatVerificationTimestamp(lastVerifiedAt),
    [lastVerifiedAt],
  );

  if (!isOpen) {
    return null;
  }

  const handleRedeem = async (event) => {
    event.preventDefault();

    const didRedeem = await redeemLicense(licenseInput);

    if (didRedeem) {
      setIsEditingKey(false);
    }
  };

  const handleRefresh = async () => {
    await refreshLicense();
  };

  const handleClear = () => {
    clearFoundersAccess();
    setLicenseInput('');
    setIsEditingKey(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex animate-fade-in items-center justify-center bg-ink/45 px-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="founders-redeem-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg animate-slide-up rounded-[28px] border border-line bg-panel p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-300">
              <Sparkles size={18} />
            </div>

            <div>
              <h2
                id="founders-redeem-title"
                className="text-lg font-semibold tracking-tight text-ink"
              >
                Founders Pack
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Redeem your Gumroad license to unlock early-access builds on
                this device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close founders pack dialog"
            className="rounded-lg p-1 text-muted transition-colors hover:bg-line/40 hover:text-ink disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-line/80 bg-elevated/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isFoundersPackActive ? (
                <>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Early access unlocked
                    </p>
                    <p className="text-xs text-muted">
                      Verified {verificationLabel}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-line/50 text-muted">
                    <KeyRound size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Not redeemed yet
                    </p>
                    <p className="text-xs text-muted">
                      Your license is checked directly with Gumroad.
                    </p>
                  </div>
                </>
              )}
            </div>

            {isFoundersPackActive && !isEditingKey ? (
              <button
                type="button"
                onClick={() => {
                  setLicenseInput(licenseKey);
                  setIsEditingKey(true);
                  clearError();
                }}
                className="text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                Use a different key
              </button>
            ) : null}
          </div>

          {isFoundersPackActive ? (
            <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
              <div className="rounded-xl bg-line/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted/70">
                  License
                </p>
                <p className="mt-1 font-medium text-ink">
                  {maskedLicenseKey || 'Stored on this device'}
                </p>
              </div>
              <div className="rounded-xl bg-line/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted/70">
                  Email
                </p>
                <p className="mt-1 font-medium text-ink">
                  {customerEmail || 'Unavailable'}
                </p>
              </div>
              <div className="rounded-xl bg-line/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted/70">
                  Name
                </p>
                <p className="mt-1 font-medium text-ink">
                  {customerName || 'Unavailable'}
                </p>
              </div>
              <div className="rounded-xl bg-line/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted/70">
                  Order
                </p>
                <p className="mt-1 font-medium text-ink">
                  {orderNumber || 'Unavailable'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Need a license? Buy the Founders Pack at{' '}
              <a
                href={foundersPackPurchaseUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-ink underline decoration-line/80 underline-offset-2 transition-colors hover:text-accent"
              >
                versionbear.gumroad.com/l/plain-founder
              </a>
              .
            </p>
          )}
        </div>

        {errorMessage ? (
          <div className="bg-red-500/8 mt-4 rounded-2xl border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {!isFoundersPackActive || isEditingKey ? (
          <form className="mt-5 space-y-3" onSubmit={handleRedeem}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">
                Gumroad license key
              </span>
              <input
                type="text"
                value={licenseInput}
                onChange={(event) => setLicenseInput(event.target.value)}
                placeholder="Paste your license key"
                autoComplete="off"
                spellCheck={false}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted">
                An internet connection is only needed while verifying the key
                with Gumroad.
              </p>

              <div className="flex items-center gap-2">
                {isFoundersPackActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLicenseInput(licenseKey);
                      setIsEditingKey(false);
                      clearError();
                    }}
                    className="rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:bg-line/35 hover:text-ink"
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : null}
                  {isFoundersPackActive ? 'Save and verify' : 'Redeem'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-muted">
              Early access stays enabled on this device. Re-enter your Gumroad
              key any time you want to verify it again.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:bg-line/35 hover:text-ink disabled:opacity-50"
              >
                Remove from this device
              </button>
              {hasStoredLicenseKey ? (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  Check again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLicenseInput('');
                    setIsEditingKey(true);
                    clearError();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                >
                  <RefreshCw size={15} />
                  Verify again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default FoundersRedeemModal;
