export const FOUNDERS_PACK_PRODUCT_ID = 'fT9ObxlW-9PyJZ0ZSxW97A==';
export const FOUNDERS_PACK_PRODUCT_NAME = 'Plain Founders Pack';

export const PLAIN_PRO_PRODUCT_ID = 'QFjad4w1JCq7VBv7WwaV4g==';
export const PLAIN_PRO_PRODUCT_NAME = 'Plain Pro';

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

export function createFoundersAccessRecord({ licenseKey, purchase = {}, productId = '' }) {
  return {
    productId: productId || purchase.product_id || '',
    productName: purchase.product_name || '',
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

  const productIdsToTry = [PLAIN_PRO_PRODUCT_ID, FOUNDERS_PACK_PRODUCT_ID];
  let successPayload = null;
  let lastErrorPayload = null;
  let successfulProductId = '';

  for (const productId of productIdsToTry) {
    let response;

    try {
      response = await fetchImpl(GUMROAD_LICENSE_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: new URLSearchParams({
          product_id: productId,
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

    if (payload?.success) {
      successPayload = payload;
      successfulProductId = productId;
      break;
    } else {
      lastErrorPayload = payload;
    }
  }

  if (!successPayload) {
    throw new Error(
      lastErrorPayload?.message || 'That license key could not be verified.',
    );
  }

  return {
    productId: successfulProductId,
    licenseKey: normalizedKey,
    purchase: successPayload.purchase || {},
    uses: successPayload.uses ?? null,
  };
}
