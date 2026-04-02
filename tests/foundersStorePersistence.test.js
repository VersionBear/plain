import { describe, expect, it } from 'vitest';
import {
  defaultPersistedFoundersState,
  mergePersistedFoundersState,
  migratePersistedFoundersState,
  partializeFoundersState,
} from '../src/store/useFoundersStore';

describe('founders store persistence helpers', () => {
  it('persists the full license key and verification metadata locally', () => {
    const persisted = partializeFoundersState({
      ...defaultPersistedFoundersState,
      productId: 'pro-id',
      productName: 'Plain Pro',
      licenseKey: 'ABCD-1234-EFGH-5678',
      maskedLicenseKey: 'ABCD-1...5678',
      customerName: 'Launch Customer',
      customerEmail: 'launch@example.com',
      orderNumber: '42',
      purchaseId: 'sale-42',
      purchaseTimestamp: '2026-04-01T12:00:00Z',
      lastVerifiedAt: 12345,
      isFoundersPackActive: true,
      hasEarlyAccess: true,
    });

    expect(persisted.licenseKey).toBe('ABCD-1234-EFGH-5678');
    expect(persisted.customerEmail).toBe('launch@example.com');
    expect(persisted.orderNumber).toBe('42');
    expect(persisted.lastVerifiedAt).toBe(12345);
  });

  it('merges missing persisted values with safe defaults', () => {
    const merged = mergePersistedFoundersState({
      productId: 'pro-id',
      hasEarlyAccess: true,
      maskedLicenseKey: 'ABCD-1...5678',
    });

    expect(merged.productId).toBe('pro-id');
    expect(merged.hasEarlyAccess).toBe(true);
    expect(merged.licenseKey).toBe('');
    expect(merged.customerEmail).toBe('');
  });

  it('migrates older persisted access records without dropping access state', () => {
    const migrated = migratePersistedFoundersState({
      productId: 'founder-id',
      productName: 'Plain Founders Pack',
      maskedLicenseKey: 'ABCD-1...5678',
      isFoundersPackActive: true,
      hasEarlyAccess: true,
      lastVerifiedAt: 98765,
    });

    expect(migrated.productName).toBe('Plain Founders Pack');
    expect(migrated.isFoundersPackActive).toBe(true);
    expect(migrated.hasEarlyAccess).toBe(true);
    expect(migrated.licenseKey).toBe('');
    expect(migrated.lastVerifiedAt).toBe(98765);
  });
});
