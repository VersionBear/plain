import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createFoundersAccessRecord,
  PLAIN_PRO_PRODUCT_ID,
  PLAIN_PRO_PRODUCT_NAME,
  verifyFoundersLicense,
} from '../utils/foundersPack';
import { getPlanTier, hasPlanAccess, PLAN_TIERS } from '../utils/planFeatures';

export const defaultPersistedFoundersState = {
  productId: PLAIN_PRO_PRODUCT_ID,
  productName: PLAIN_PRO_PRODUCT_NAME,
  licenseKey: '',
  maskedLicenseKey: '',
  customerName: '',
  customerEmail: '',
  orderNumber: '',
  purchaseId: '',
  purchaseTimestamp: '',
  lastVerifiedAt: null,
  isFoundersPackActive: false,
  hasEarlyAccess: false,
};

export function mergePersistedFoundersState(persistedState = {}) {
  return {
    ...defaultPersistedFoundersState,
    ...(persistedState || {}),
  };
}

export function partializeFoundersState(state) {
  return {
    productId: state.productId,
    productName: state.productName,
    licenseKey: state.licenseKey,
    maskedLicenseKey: state.maskedLicenseKey,
    customerName: state.customerName,
    customerEmail: state.customerEmail,
    orderNumber: state.orderNumber,
    purchaseId: state.purchaseId,
    purchaseTimestamp: state.purchaseTimestamp,
    lastVerifiedAt: state.lastVerifiedAt,
    isFoundersPackActive: state.isFoundersPackActive,
    hasEarlyAccess: state.hasEarlyAccess,
  };
}

export function migratePersistedFoundersState(
  persistedState = {},
  _version = 0,
) {
  return mergePersistedFoundersState(persistedState);
}

export const selectHasEarlyAccess = (state) => state.hasEarlyAccess;
export const selectPlanTier = (state) => getPlanTier(state);
export const selectHasProAccess = (state) =>
  hasPlanAccess(selectPlanTier(state), PLAN_TIERS.PRO);
export const selectHasFounderAccess = (state) =>
  hasPlanAccess(selectPlanTier(state), PLAN_TIERS.FOUNDER);

export const useFoundersStore = create(
  persist(
    (set, get) => ({
      ...defaultPersistedFoundersState,
      isSubmitting: false,
      errorMessage: '',
      clearError: () => set({ errorMessage: '' }),
      clearFoundersAccess: () =>
        set({
          ...defaultPersistedFoundersState,
          isSubmitting: false,
          errorMessage: '',
        }),
      redeemLicense: async (licenseKey) => {
        set({ isSubmitting: true, errorMessage: '' });

        try {
          const verification = await verifyFoundersLicense(licenseKey);

          set({
            ...createFoundersAccessRecord(verification),
            isSubmitting: false,
            errorMessage: '',
          });

          return true;
        } catch (error) {
          set({
            isSubmitting: false,
            errorMessage:
              error instanceof Error
                ? error.message
                : 'That license key could not be verified.',
          });

          return false;
        }
      },
      refreshLicense: async () => {
        const { licenseKey } = get();

        if (!licenseKey) {
          set({ errorMessage: 'Add your Gumroad license key first.' });
          return false;
        }

        set({ isSubmitting: true, errorMessage: '' });

        try {
          const verification = await verifyFoundersLicense(licenseKey);

          set({
            ...createFoundersAccessRecord(verification),
            isSubmitting: false,
            errorMessage: '',
          });

          return true;
        } catch (error) {
          set({
            isSubmitting: false,
            errorMessage:
              error instanceof Error
                ? error.message
                : 'That license key could not be verified.',
          });

          return false;
        }
      },
    }),
    {
      name: 'plain-founders-pack',
      version: 2,
      partialize: partializeFoundersState,
      migrate: migratePersistedFoundersState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...mergePersistedFoundersState(persistedState),
      }),
    },
  ),
);
