export const FOUNDERS_PACK_PRODUCT_ID = 'fT9ObxlW-9PyJZ0ZSxW97A==';
export const FOUNDERS_PACK_PRODUCT_NAME = 'Plain Founders Pack';
export const GUMROAD_LICENSE_VERIFY_URL =
  'https://api.gumroad.com/v2/licenses/verify';

export function maskLicenseKey(licenseKey) {
  const normalizedKey = licenseKey.trim();

  if (!normalizedKey) {
    return '';
  }

  if (normalizedKey.length <= 8) {
    return normalizedKey;
  }

  return `${normalizedKey.slice(0, 6)}...${normalizedKey.slice(-4)}`;
}

export function createFoundersAccessRecord({ licenseKey, purchase = {} }) {
  return {
    productId: purchase.product_id || FOUNDERS_PACK_PRODUCT_ID,
    productName: purchase.product_name || FOUNDERS_PACK_PRODUCT_NAME,
    licenseKey,
    maskedLicenseKey: maskLicenseKey(licenseKey),
    customerName: purchase.full_name || purchase.name || '',
    customerEmail: purchase.email || '',
    orderNumber: purchase.order_number || '',
    purchaseId: purchase.sale_id || purchase.id || '',
    purchaseTimestamp: purchase.sale_timestamp || '',
    lastVerifiedAt: Date.now(),
    isFoundersPackActive: true,
    hasEarlyAccess: true,
  };
}

export async function verifyFoundersLicense(licenseKey, fetchImpl = fetch) {
  const normalizedKey = licenseKey.trim();

  if (!normalizedKey) {
    throw new Error('Enter your Gumroad license key.');
  }

  let response;

  try {
    response = await fetchImpl(GUMROAD_LICENSE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        product_id: FOUNDERS_PACK_PRODUCT_ID,
        license_key: normalizedKey,
        increment_uses_count: 'false',
      }),
    });
  } catch {
    throw new Error(
      'Could not reach Gumroad. Check your connection and try again.',
    );
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    throw new Error(
      'Gumroad returned an unreadable response. Please try again.',
    );
  }

  if (!payload?.success) {
    throw new Error(
      payload?.message || 'That license key could not be verified.',
    );
  }

  return {
    licenseKey: normalizedKey,
    purchase: payload.purchase || {},
    uses: payload.uses ?? null,
  };
}
