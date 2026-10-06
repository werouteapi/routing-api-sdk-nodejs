/**
 * Routing API Node.js SDK - Billing Integration
 * 
 * Provides methods for:
 * - Getting current usage & charges
 * - Managing subscriptions
 * - Tracking revenue-share earnings
 * - Downloading invoices
 * 
 * Usage:
 *   const { RoutingAPIClient, Billing } = require('routing-api-client');
 *   
 *   const client = new RoutingAPIClient({ apiKey: 'rn_your_key' });
 *   const billing = new Billing(client);
 *   
 *   // Get current usage
 *   const usage = await billing.getUsage();
 *   console.log(`Charges this month: $${usage.charges_this_month}`);
 *   
 *   // Upgrade to subscription
 *   const sub = await billing.createSubscription({
 *     plan: 'professional',
 *     paymentProvider: 'dodo',
 *   });
 *   console.log(`Subscription active: ${sub.status}`);
 */

class BillingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BillingError';
  }
}

class Billing {
  constructor(client) {
    this.client = client;
    this.baseEndpoint = 'api/v2/billing';
  }

  /**
   * Get current month's usage and charges
   * @returns {Promise<Object>} Usage data
   */
  async getUsage() {
    return this.client._request('GET', `${this.baseEndpoint}/usage`);
  }

  /**
   * Estimate monthly charges based on request count and transaction amount
   * @param {number} requestsCount - Number of API requests
   * @param {number} avgAmount - Average transaction amount
   * @returns {Object} Estimated charges
   */
  estimateCharges(requestsCount, avgAmount = 0) {
    const base = requestsCount * 0.50;
    const percent = avgAmount > 0 ? (requestsCount * avgAmount) * 0.015 : 0;
    return {
      requests: requestsCount,
      avg_amount: avgAmount,
      base_charge: base,
      percent_charge: percent,
      total_charge: base + percent,
    };
  }

  /**
   * Create or upgrade to a subscription.
   * @param {Object} opts
   * @param {string} opts.plan                   - 'starter'|'professional'|'enterprise'
   * @param {string} opts.paymentProvider        - 'dodo'|'polar'|'paddle'|'lemon_squeezy'  (default: 'dodo', cheapest for Tunisia)
   * @param {string} opts.paymentCustomerId      - Paddle ctm_... or LS customer ID
   * @param {string} opts.paymentSubscriptionId  - External subscription ID (optional)
   */
  async createSubscription({ plan, paymentProvider = '', paymentCustomerId = '', paymentSubscriptionId = '' }) {
    if (!['starter', 'professional', 'enterprise'].includes(plan)) {
      throw new BillingError(`Invalid plan: ${plan}. Choose: starter, professional, enterprise`);
    }
    const body = { plan, payment_provider: paymentProvider };
    if (paymentCustomerId)     body.payment_customer_id     = paymentCustomerId;
    if (paymentSubscriptionId) body.payment_subscription_id = paymentSubscriptionId;
    return this.client._request('POST', `${this.baseEndpoint}/subscribe`, { body });
  }

  /**
   * Update an active subscription
   * @param {Object} params - Parameters
   * @param {string} params.action - 'change_plan', 'pause', or 'resume'
   * @param {string} params.plan - New plan (required if action='change_plan')
   * @returns {Promise<Object>} Update confirmation
   */
  async updateSubscription({ action, plan }) {
    const payload = { action };
    if (plan) payload.plan = plan;

    return this.client._request('PATCH', `${this.baseEndpoint}/subscription`, { body: payload });
  }

  /**
   * Cancel active subscription
   * @returns {Promise<Object>} Cancellation confirmation
   */
  async cancelSubscription() {
    return this.client._request('POST', `${this.baseEndpoint}/cancel`);
  }

  /**
   * List invoices with pagination
   * @param {Object} params - Parameters
   * @param {number} params.limit - Number of invoices (1-100, default 50)
   * @param {number} params.offset - Pagination offset (default 0)
   * @param {string} params.status - Filter by status
   * @returns {Promise<Object>} List of invoices
   */
  async listInvoices({ limit = 50, offset = 0, status } = {}) {
    const queryParams = {
      limit: Math.min(limit, 100),
      offset,
    };
    if (status) queryParams.status = status;

    return this.client._request('GET', `${this.baseEndpoint}/invoices`, { params: queryParams });
  }

  /**
   * Get detailed invoice with line items
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  async getInvoice(invoiceId) {
    return this.client._request('GET', `${this.baseEndpoint}/invoices/${invoiceId}`);
  }

  /**
   * Get revenue-share partner dashboard
   * @returns {Promise<Object>} Partner earnings and metrics
   */
  async getRevenueShareDashboard() {
    return this.client._request('GET', `${this.baseEndpoint}/revenue-share`);
  }

  /**
   * Switch to a different billing model
   * @param {Object} params - Parameters
   * @param {string} params.model - 'pay_per_tx', 'subscription', or 'revenue_share'
   * @param {string} params.plan - Plan name (required if model='subscription')
   * @returns {Promise<Object>} Switch confirmation
   */
  async switchBillingModel({ model, plan }) {
    if (!['pay_per_tx', 'subscription', 'revenue_share'].includes(model)) {
      throw new BillingError(`Invalid model: ${model}`);
    }

    const payload = { model };
    if (plan) payload.plan = plan;

    return this.client._request('POST', `${this.baseEndpoint}/switch-model`, { body: payload });
  }

  /**
   * Estimate monthly cost for different billing models
   * @param {Object} params - Parameters
   * @param {string} params.model - 'pay_per_tx' or 'subscription'
   * @param {number} params.requests - Estimated monthly requests
   * @param {number} params.avgAmount - Average transaction amount
   * @returns {Object} Cost estimates and comparison
   */
  estimateMonthlyCost({ model = 'pay_per_tx', requests = 100000, avgAmount = 50 } = {}) {
    // Pay-per-tx: $0.50 per request + 1.5% of amount
    const pptCost = (requests * 0.50) + (requests * avgAmount * 0.015);

    // Subscription tiers
    const subCosts = {
      starter: 99.00,
      professional: 499.00,
      enterprise: 1999.00,
    };

    const results = {
      requests,
      avg_amount: avgAmount,
      pay_per_tx: pptCost,
      subscription_starter: subCosts.starter,
      subscription_professional: subCosts.professional,
      subscription_enterprise: subCosts.enterprise,
    };

    // Calculate best option
    const allCosts = Object.values(subCosts).concat(pptCost);
    const bestCost = Math.min(...allCosts);

    results.best_model = bestCost === pptCost
      ? 'pay_per_tx'
      : `subscription_${Object.keys(subCosts)[Object.values(subCosts).indexOf(bestCost)]}`;
    results.best_cost = bestCost;
    results.savings_vs_pay_per_tx = pptCost - bestCost;
    results.savings_percent = pptCost > 0 ? ((pptCost - bestCost) / pptCost * 100) : 0;

    return results;
  }
}

module.exports = { Billing, BillingError };
