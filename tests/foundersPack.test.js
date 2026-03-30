import { describe, expect, it, vi } from 'vitest';
import {
  createFoundersAccessRecord,
  FOUNDERS_PACK_PRODUCT_ID,
  maskLicenseKey,
  verifyFoundersLicense,
} from '../src/utils/foundersPack';

describe('founders pack helpers', () => {
  it('masks long license keys while preserving the edges', () => {
    expect(maskLicenseKey('ABCD-1234-EFGH-5678')).toBe('ABCD-1...5678');
    expect(maskLicenseKey('SHORT')).toBe('SHORT');
  });

  it('creates a persisted access record from a Gumroad purchase', () => {
    const record = createFoundersAccessRecord({
      licenseKey: 'ABCD-1234-EFGH-5678',
      purchase: {
        product_name: 'Plain Founders Pack',
        email: 'founder@example.com',
        full_name: 'Founding Customer',
        order_number: 42,
        sale_id: 'sale-1',
      },
    });

    expect(record.productId).toBe(FOUNDERS_PACK_PRODUCT_ID);
    expect(record.customerEmail).toBe('founder@example.com');
    expect(record.customerName).toBe('Founding Customer');
    expect(record.maskedLicenseKey).toBe('ABCD-1...5678');
    expect(record.isFoundersPackActive).toBe(true);
    expect(record.hasEarlyAccess).toBe(true);
  });

  it('posts the license key to Gumroad and returns purchase data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        uses: 1,
        purchase: {
          email: 'founder@example.com',
          product_name: 'Plain Founders Pack',
        },
      }),
    });

    const result = await verifyFoundersLicense('LICENSE-123', fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.gumroad.com/v2/licenses/verify',
    );
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(fetchMock.mock.calls[0][1].body.toString()).toContain(
      `product_id=${encodeURIComponent(FOUNDERS_PACK_PRODUCT_ID)}`,
    );
    expect(result.purchase.email).toBe('founder@example.com');
    expect(result.licenseKey).toBe('LICENSE-123');
  });

  it('surfaces Gumroad verification failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        message: 'That license does not exist for the provided product.',
      }),
    });

    await expect(verifyFoundersLicense('BAD-KEY', fetchMock)).rejects.toThrow(
      'That license does not exist for the provided product.',
    );
  });
});
