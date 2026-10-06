/**
 * Routing API Node.js SDK — Merchant of Record (Card Processing)
 *
 * Paddle       → /api/v2/paddle/*
 * Lemon Squeezy → /api/v2/lemonsqueezy/*
 *
 * Both work from Tunisia. No Stripe account needed.
 *
 * Usage:
 *   const { RoutingAPIClient } = require('routing-api-client');
 *   const MoR = require('./mor');
 *
 *   const client = new RoutingAPIClient({ apiKey: 'rn_your_key' });
 *   const mor = new MoR(client);
 *
 *   // Paddle checkout
 *   const checkout = await mor.paddleCheckout({
 *     items: [{ price_id: 'pri_xxx', quantity: 1 }],
 *     customerEmail: 'user@example.com',
 *     successUrl: 'https://yourapp.com/thank-you'
 *   });
 *   // redirect to checkout.checkout_url
 *
 *   // Lemon Squeezy checkout
 *   const checkout = await mor.lsCheckout({
 *     variantId: '12345',
 *     customerEmail: 'user@example.com'
 *   });
 */

class MoRError extends Error {
  constructor(message) { super(message); this.name = 'MoRError'; }
}

class MoR {
  constructor(client) { this.client = client; }

  // ── Status ─────────────────────────────────────────────────────────────────

  async status() {
    return this.client._request('GET', 'api/v2/mor/status');
  }

  // ── Paddle ─────────────────────────────────────────────────────────────────

  async paddleCreateProduct({ name, description = '', taxCategory = 'saas' }) {
    return this.client._request('POST', 'api/v2/paddle/products',
      { name, description, tax_category: taxCategory });
  }

  async paddleCreatePrice({ productId, amountCents, currency = 'USD', description = '', billingCycle = null }) {
    const body = { product_id: productId, amount_cents: amountCents, currency, description };
    if (billingCycle) body.billing_cycle = billingCycle;
    return this.client._request('POST', 'api/v2/paddle/prices', body);
  }

  async paddleCreateCustomer({ email, name = '' }) {
    return this.client._request('POST', 'api/v2/paddle/customers', { email, name });
  }

  /**
   * Create Paddle hosted checkout. Redirect customer to checkout_url.
   * @param {Object} opts
   * @param {Array}  opts.items           - [{ price_id, quantity }]
   * @param {string} opts.customerEmail
   * @param {string} opts.customerId      - Paddle ctm_...
   * @param {string} opts.successUrl
   * @param {Object} opts.customData
   */
  async paddleCheckout({ items, customerEmail = '', customerId = '', successUrl = '', customData = null }) {
    const body = { items };
    if (customerEmail) body.customer_email = customerEmail;
    if (customerId)    body.customer_id    = customerId;
    if (successUrl)    body.success_url    = successUrl;
    if (customData)    body.custom_data    = customData;
    return this.client._request('POST', 'api/v2/paddle/checkout', body);
  }

  async paddleGetTransaction(transactionId) {
    return this.client._request('GET', `api/v2/paddle/transactions/${transactionId}`);
  }

  async paddleListSubscriptions({ customerId = '', status = '' } = {}) {
    const params = {};
    if (customerId) params.customer_id = customerId;
    if (status)     params.status      = status;
    return this.client._request('GET', 'api/v2/paddle/subscriptions', params);
  }

  async paddleCancelSubscription(subscriptionId, effectiveFrom = 'next_billing_period') {
    return this.client._request('POST',
      `api/v2/paddle/subscriptions/${subscriptionId}/cancel`,
      { effective_from: effectiveFrom });
  }

  // ── Lemon Squeezy ──────────────────────────────────────────────────────────

  async lsListProducts() {
    return this.client._request('GET', 'api/v2/lemonsqueezy/products');
  }

  async lsListVariants(productId = '') {
    const params = productId ? { product_id: productId } : {};
    return this.client._request('GET', 'api/v2/lemonsqueezy/variants', params);
  }

  /**
   * Create Lemon Squeezy hosted checkout. Redirect customer to checkout_url.
   * @param {Object} opts
   * @param {string} opts.variantId       - From LS dashboard
   * @param {string} opts.customerEmail
   * @param {string} opts.customerName
   * @param {string} opts.successUrl
   * @param {Object} opts.customData
   * @param {string} opts.discountCode
   */
  async lsCheckout({ variantId, customerEmail = '', customerName = '', successUrl = '', customData = null, discountCode = '' }) {
    const body = { variant_id: variantId };
    if (customerEmail) body.customer_email = customerEmail;
    if (customerName)  body.customer_name  = customerName;
    if (successUrl)    body.success_url    = successUrl;
    if (customData)    body.custom_data    = customData;
    if (discountCode)  body.discount_code  = discountCode;
    return this.client._request('POST', 'api/v2/lemonsqueezy/checkout', body);
  }

  async lsGetOrder(orderId) {
    return this.client._request('GET', `api/v2/lemonsqueezy/orders/${orderId}`);
  }

  async lsRefundOrder(orderId) {
    return this.client._request('POST', `api/v2/lemonsqueezy/orders/${orderId}/refund`, {});
  }

  async lsListSubscriptions({ email = '', status = '' } = {}) {
    const params = {};
    if (email)  params.email  = email;
    if (status) params.status = status;
    return this.client._request('GET', 'api/v2/lemonsqueezy/subscriptions', params);
  }

  async lsCancelSubscription(subscriptionId) {
    return this.client._request('DELETE', `api/v2/lemonsqueezy/subscriptions/${subscriptionId}`);
  }

  async lsReportUsage({ subscriptionItemId, quantity, action = 'increment' }) {
    return this.client._request('POST', 'api/v2/lemonsqueezy/usage',
      { subscription_item_id: subscriptionItemId, quantity, action });
  }

  async lsCreateDiscount({ name, code, amount, amountType = 'percent', duration = 'once' }) {
    return this.client._request('POST', 'api/v2/lemonsqueezy/discounts',
      { name, code, amount, amount_type: amountType, duration });
  }
}

module.exports = { MoR, MoRError };
