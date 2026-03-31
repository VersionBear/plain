import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createFoundersAccessRecord,
  PLAIN_PRO_PRODUCT_ID,
  PLAIN_PRO_PRODUCT_NAME,
  verifyFoundersLicense,
} from '../utils/foundersPack';
import { getPlanTier, hasPlanAccess, PLAN_TIERS } from '../utils/planFeatures';

const defaultPersistedState = {
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

export const selectHasEarlyAccess = (state) => state.hasEarlyAccess;
export const selectPlanTier = (state) => getPlanTier(state);
export const selectHasProAccess = (state) =>
  hasPlanAccess(selectPlanTier(state), PLAN_TIERS.PRO);
export const selectHasFounderAccess = (state) =>
  hasPlanAccess(selectPlanTier(state), PLAN_TIERS.FOUNDER);

export const useFoundersStore = create(
  persist(
    (set, get) => ({
      ...defaultPersistedState,
      isSubmitting: false,
      errorMessage: '',
      clearError: () => set({ errorMessage: '' }),
      clearFoundersAccess: () =>
        set({
          ...defaultPersistedState,
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
      partialize: (state) => ({
        productId: state.productId,
        productName: state.productName,
        maskedLicenseKey: state.maskedLicenseKey,
        lastVerifiedAt: state.lastVerifiedAt,
        isFoundersPackActive: state.isFoundersPackActive,
        hasEarlyAccess: state.hasEarlyAccess,
      }),
    },
  ),
);
