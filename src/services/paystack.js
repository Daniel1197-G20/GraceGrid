/**
 * Paystack Inline Integration Service
 * 
 * Provides seamless in-app modal checkout for GraceGrid donations.
 * Opens Paystack Inline popup (Cards, Bank Transfer, USSD, Apple Pay)
 * directly over the site without redirecting to an external page.
 */

const PAYSTACK_INLINE_URL = 'https://js.paystack.co/v1/inline.js';

let scriptLoadingPromise = null;

/**
 * Dynamically loads the Paystack Inline JS SDK if not already available on window.
 * @returns {Promise<any>} Resolves with window.PaystackPop
 */
export function loadPaystackScript() {
  if (typeof window !== 'undefined' && window.PaystackPop) {
    return Promise.resolve(window.PaystackPop);
  }

  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Document is not available in current environment.'));
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script element is already present in DOM
    const existing = document.querySelector(`script[src*="paystack.co"]`);
    if (existing) {
      if (window.PaystackPop) {
        return resolve(window.PaystackPop);
      }
      existing.addEventListener('load', () => resolve(window.PaystackPop));
      existing.addEventListener('error', () => {
        scriptLoadingPromise = null;
        reject(new Error('Failed to load Paystack Inline SDK.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_URL;
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop);
      } else {
        reject(new Error('PaystackPop object not found after script load.'));
      }
    };
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error('Failed to load Paystack Inline SDK. Please check your internet connection.'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Opens the Paystack Inline checkout modal.
 * 
 * @param {Object} options
 * @param {string} options.publicKey - Paystack Public Key (pk_live_... or pk_test_...)
 * @param {string} options.email - Donor email address
 * @param {number} options.amount - Amount in NGN (Naira)
 * @param {string} [options.donorName] - Optional donor name
 * @param {string} [options.reference] - Unique transaction reference
 * @param {Function} [options.onSuccess] - Callback when payment completes successfully
 * @param {Function} [options.onClose] - Callback when user closes modal without paying
 */
export async function openPaystackInlineCheckout({
  publicKey,
  email,
  amount,
  donorName = '',
  reference,
  onSuccess,
  onClose,
}) {
  if (!publicKey) {
    throw new Error('Paystack public key (VITE_PAYSTACK_PUBLIC_KEY) is required for inline checkout.');
  }

  if (!email || !email.includes('@')) {
    throw new Error('A valid donor email address is required for Paystack checkout.');
  }

  if (!amount || amount <= 0) {
    throw new Error('Please select or enter a valid donation amount.');
  }

  // Ensure Paystack SDK is ready
  const PaystackPop = await loadPaystackScript();

  const txRef = reference || `gg_seed_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const amountInKobo = Math.round(amount * 100);

  const customFields = [
    {
      display_name: 'Seed Purpose',
      variable_name: 'purpose',
      value: 'GraceGrid Technical Launch Milestones',
    },
  ];

  if (donorName && donorName.trim()) {
    customFields.push({
      display_name: 'Donor Name',
      variable_name: 'donor_name',
      value: donorName.trim(),
    });
  }

  // Modern PaystackPop vs Legacy setup support
  if (typeof PaystackPop.setup === 'function') {
    const handler = PaystackPop.setup({
      key: publicKey,
      email: email.trim(),
      amount: amountInKobo,
      currency: 'NGN',
      ref: txRef,
      metadata: {
        custom_fields: customFields,
      },
      callback: function (response) {
        if (onSuccess) {
          onSuccess({
            ...response,
            amount,
            email: email.trim(),
            donorName: donorName.trim(),
            reference: response.reference || txRef,
          });
        }
      },
      onClose: function () {
        if (onClose) onClose();
      },
    });

    handler.openIframe();
    return handler;
  }

  // Alternative instance-based popup constructor
  if (typeof PaystackPop === 'function') {
    const paystack = new PaystackPop();
    return paystack.newTransaction({
      key: publicKey,
      email: email.trim(),
      amount: amountInKobo,
      currency: 'NGN',
      ref: txRef,
      metadata: {
        custom_fields: customFields,
      },
      onSuccess: (response) => {
        if (onSuccess) {
          onSuccess({
            ...response,
            amount,
            email: email.trim(),
            donorName: donorName.trim(),
            reference: response.reference || txRef,
          });
        }
      },
      onCancel: () => {
        if (onClose) onClose();
      },
    });
  }

  throw new Error('Paystack inline SDK is not initialized correctly.');
}
