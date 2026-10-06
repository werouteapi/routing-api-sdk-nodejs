/**
 * Routing API SDK for Node.js
 * Official client library for the Routing API
 */

const axios = require('axios');
const crypto = require('crypto');

class RoutingAPIClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'http://localhost:8800';
    this.timeout = options.timeout || 30000;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'routing-api-client-nodejs/2.0.0'
      }
    });
  }

  async _request(method, endpoint, data = {}) {
    try {
      const response = await this.client({
        method,
        url: endpoint,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined
      });
      return response.data;
    } catch (error) {
      throw new Error(`API Error: ${error.response?.status} - ${error.message}`);
    }
  }

  // Legacy methods
  async lookupBank(routingNumber, transferType = 'ach') {
    return this._request('GET', 'bank-information', { 
      routing_number: routingNumber, 
      transfer_type: transferType 
    });
  }

  async lookupSwift(bic) {
    return this._request('GET', 'swift-lookup', { bic });
  }

  async searchSwift(query) {
    return this._request('GET', 'swift-search', { query });
  }

  async getAchInfo(routingNumber) {
    return this._request('GET', 'ach-info', { routing_number: routingNumber });
  }

  async getFedwireInfo(routingNumber) {
    return this._request('GET', 'fedwire-info', { routing_number: routingNumber });
  }

  async checkCompliance(routingNumber, amount = null, currency = 'USD') {
    return this._request('GET', 'compliance-check', { 
      routing_number: routingNumber,
      amount: amount,
      currency: currency
    });
  }

  async validateIban(iban) {
    return this._request('POST', 'iban-validate', { iban });
  }

  async validateRoutingNumber(routingNumber, country = 'US') {
    return this._request('POST', 'routing-validate', { 
      routing_number: routingNumber,
      country: country
    });
  }


  /**
   * Register a webhook endpoint for transaction events
   */
  async registerWebhook(webhookUrl, events = "*") {
    return this._request("POST", "api/v2/webhooks/register", {
      webhook_url: webhookUrl,
      events: events
    });
  }

  /**
   * Get webhook event delivery status
   */
  async getWebhookStatus(eventId) {
    return this._request("GET", `api/v2/webhooks/events/${eventId}`);
  }

  /**
   * Get provider performance metrics for adaptive routing
   */
  async getRoutingMetrics() {
    return this._request("GET", "api/v2/routing/metrics");
  }

  /**
   * Get routing optimization recommendations
   */
  async getRoutingRecommendations() {
    return this._request("GET", "api/v2/routing/recommendations");
  }

  /**
   * Create a custom routing rule
   */
  async createRoutingRule(name, provider, country = null, binRange = null, priority = 100) {
    const params = { name, provider, priority };
    if (country) params.condition_country = country;
    if (binRange) params.condition_bin = binRange;
    return this._request("POST", "api/v2/routing/rules", params);
  }

  /**
   * Create an A/B test between two providers
   */
  async createABTest(testId, providerA, providerB, splitPercentage = 50) {
    return this._request("POST", "api/v2/routing/ab-test", {
      test_id: testId,
      provider_a: providerA,
      provider_b: providerB,
      split: splitPercentage
    });
  }

  /**
   * Get transaction recovery statistics
   */
  async getRecoveryStats() {
    return this._request("GET", "api/v2/recovery/stats");
  }

  /**
   * Get transaction status and recovery details
   */
  async getTransactionStatus(transactionId) {
    return this._request("GET", `api/v2/transactions/${transactionId}`);
  }

  /**
   * Evaluate fraud risk for a transaction
   */
  async checkFraudRisk(userId, routingNumber, transferType, amount, currency = "USD", country = null, binRange = null) {
    const params = {
      user_id: userId,
      routing_number: routingNumber,
      transfer_type: transferType,
      amount: amount,
      currency: currency
    };
    if (country) params.country = country;
    if (binRange) params.bin_range = binRange;
    return this._request("POST", "api/v2/fraud-check", params);
  }

  /**
   * List all supported payment methods
   */
  async listPaymentMethods(country = null) {
    const params = {};
    if (country) params.country = country;
    return this._request("GET", "api/v2/payment-methods/supported", params);
  }

  /**
   * Validate a payment method
   */
  async validatePaymentMethod(paymentMethod, identifier, country = null) {
    const params = {
      payment_method: paymentMethod,
      identifier: identifier
    };
    if (country) params.country = country;
    return this._request("POST", "api/v2/payment-methods/validate", params);
  }

  /**
   * Get status of all enhanced features
   */
  async getFeaturesStatus() {
    return this._request("GET", "api/v2/features/status");
  }

  // ========== FREE FEATURES: TRANSFERS (Dwolla) ==========

  /**
   * Create ACH transfer via Dwolla (free tier: $0/month)
   */
  async createTransfer(sourceUrl, destinationUrl, amount, metadata = {}) {
    return this._request("POST", "api/v2/transfers/create", {
      source_url: sourceUrl,
      destination_url: destinationUrl,
      amount: amount,
      metadata: metadata
    });
  }

  /**
   * Check status of ACH transfer
   */
  async getTransferStatus(transferId) {
    return this._request("GET", "api/v2/transfers/status", {
      transfer_id: transferId
    });
  }

  // ========== FREE FEATURES: TOKENIZATION (Encryption) ==========

  /**
   * Tokenize credit/debit card (never store raw card data)
   */
  async tokenizeCard(cardNumber, cardHolder = null) {
    return this._request("POST", "api/v2/tokenize/card", {
      card_number: cardNumber,
      card_holder: cardHolder
    });
  }

  /**
   * Tokenize IBAN (International Bank Account Number)
   */
  async tokenizeIban(iban, accountHolder = null) {
    return this._request("POST", "api/v2/tokenize/iban", {
      iban: iban,
      account_holder: accountHolder
    });
  }

  /**
   * Tokenize bank account (routing + account number)
   */
  async tokenizeBankAccount(routingNumber, accountNumber, accountHolder = null) {
    return this._request("POST", "api/v2/tokenize/bank-account", {
      routing_number: routingNumber,
      account_number: accountNumber,
      account_holder: accountHolder
    });
  }

  // ========== FREE FEATURES: APPROVALS (Fraud Detection + Workflow) ==========

  /**
   * Evaluate transaction for fraud risk and auto-approve or queue for review
   */
  async evaluateTransaction(userId, transactionId, amount, merchant, timestamp, location, paymentMethod, metadata = {}) {
    return this._request("POST", "api/v2/approvals/evaluate", {
      user_id: userId,
      transaction_id: transactionId,
      amount: amount,
      merchant: merchant,
      timestamp: timestamp,
      location: location,
      payment_method: paymentMethod,
      metadata: metadata
    });
  }

  /**
   * Admin: Approve flagged transaction
   */
  async approveTransaction(ticketId, notes = null) {
    return this._request("POST", "api/v2/approvals/admin/approve", {
      ticket_id: ticketId,
      notes: notes
    });
  }

  /**
   * Admin: Reject flagged transaction
   */
  async rejectTransaction(ticketId, reason = null) {
    return this._request("POST", "api/v2/approvals/admin/reject", {
      ticket_id: ticketId,
      reason: reason
    });
  }

  // ========== FREE FEATURES: COMPLIANCE (OFAC Screening) ==========

  /**
   * Screen entity against OFAC sanctions list
   */
  async screenForCompliance(name, country = "") {
    return this._request("GET", "api/v2/compliance/screen", {
      name: name,
      country: country
    });
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStats() {
    return this._request("GET", "api/v2/compliance/stats");
  }

  // ========== FREE FEATURES: TICKETING (Support System) ==========

  /**
   * Create support ticket
   */
  async createTicket(userId, title, description, category = "general", priority = "normal", userEmail = null) {
    return this._request("POST", "api/v2/tickets/create", {
      user_id: userId,
      title: title,
      description: description,
      category: category,
      priority: priority,
      user_email: userEmail
    });
  }

  /**
   * Get ticket details with all replies
   */
  async getTicket(ticketId) {
    return this._request("GET", `api/v2/tickets/${ticketId}`);
  }

  /**
   * Get all tickets for user
   */
  async getUserTickets(userId, status = null, limit = 50) {
    const params = { status, limit };
    return this._request("GET", `api/v2/tickets/user/${userId}`, params);
  }

  /**
   * Add reply to ticket
   */
  async addTicketReply(ticketId, replyBy, replyText, isInternal = false) {
    return this._request("POST", `api/v2/tickets/${ticketId}/reply`, {
      reply_by: replyBy,
      reply_text: replyText,
      is_internal: isInternal
    });
  }

  /**
   * Admin: Get open support tickets
   */
  async getOpenTickets(limit = 50) {
    return this._request("GET", "api/v2/tickets/admin/open", { limit });
  }

  /**
   * Admin: Get ticketing statistics
   */
  async getTicketingStats() {
    return this._request("GET", "api/v2/tickets/admin/stats");
  }

  // ========== FREE FEATURES: STATUS ==========

  /**
   * Get status of all free features
   */
  async getFreeFeaturesStatus() {
    return this._request("GET", "api/v2/free-features/status");
  }

  // ========== STRIPE ==========
  async stripePublishableKey() { return this._request("GET","api/v2/stripe/publishable-key"); }
  async stripeCreateCustomer(email,name=null,phone=null,metadata=null) { return this._request("POST","api/v2/stripe/customers/create",{email,name,phone,metadata}); }
  async stripeGetCustomer(customerId) { return this._request("GET",`api/v2/stripe/customers/${customerId}`); }
  async stripeCreatePaymentIntent(amountCents,currency="usd",customerId=null,paymentMethodId=null,confirm=false,description=null,metadata=null,captureMethod="automatic") { return this._request("POST","api/v2/stripe/payment-intents/create",{amount_cents:amountCents,currency,customer_id:customerId,payment_method_id:paymentMethodId,confirm,description,metadata,capture_method:captureMethod}); }
  async stripeConfirmPaymentIntent(paymentIntentId,paymentMethodId) { return this._request("POST",`api/v2/stripe/payment-intents/${paymentIntentId}/confirm`,{payment_method_id:paymentMethodId}); }
  async stripeGetPaymentIntent(paymentIntentId) { return this._request("GET",`api/v2/stripe/payment-intents/${paymentIntentId}`); }
  async stripeCancelPaymentIntent(paymentIntentId) { return this._request("POST",`api/v2/stripe/payment-intents/${paymentIntentId}/cancel`,{}); }
  async stripeCapturePaymentIntent(paymentIntentId,amountToCapture=null) { return this._request("POST",`api/v2/stripe/payment-intents/${paymentIntentId}/capture`,{amount_to_capture:amountToCapture}); }
  async stripeChargeCard(amountCents,currency="usd",source=null,customerId=null,description=null,metadata=null) { return this._request("POST","api/v2/stripe/charges",{amount_cents:amountCents,currency,source,customer_id:customerId,description,metadata}); }
  async stripeCreateRefund(chargeId=null,paymentIntentId=null,amountCents=null,reason="requested_by_customer") { return this._request("POST","api/v2/stripe/refunds",{charge_id:chargeId,payment_intent_id:paymentIntentId,amount_cents:amountCents,reason}); }
  async stripeAttachPaymentMethod(paymentMethodId,customerId) { return this._request("POST",`api/v2/stripe/payment-methods/${paymentMethodId}/attach`,{customer_id:customerId}); }
  async stripeListPaymentMethods(customerId) { return this._request("GET",`api/v2/stripe/customers/${customerId}/payment-methods`); }
  async stripeCreateSetupIntent(customerId,usage="off_session") { return this._request("POST","api/v2/stripe/setup-intents",{customer_id:customerId,usage}); }

  // ========== PLAID ==========
  async plaidCreateLinkToken(userId,clientName="Routing API",products=["auth","balance"],countryCodes=["US"],webhook=null) { return this._request("POST","api/v2/plaid/link-token",{user_id:userId,client_name:clientName,products,country_codes:countryCodes,webhook}); }
  async plaidExchangeToken(publicToken) { return this._request("POST","api/v2/plaid/exchange-token",{public_token:publicToken}); }
  async plaidGetAuth(accessToken) { return this._request("POST","api/v2/plaid/auth",{access_token:accessToken}); }
  async plaidGetBalance(accessToken) { return this._request("POST","api/v2/plaid/balance",{access_token:accessToken}); }
  async plaidGetAccounts(accessToken) { return this._request("POST","api/v2/plaid/accounts",{access_token:accessToken}); }
  async plaidGetIdentity(accessToken) { return this._request("POST","api/v2/plaid/identity",{access_token:accessToken}); }
  async plaidGetTransactions(accessToken,startDate,endDate,count=100) { return this._request("POST","api/v2/plaid/transactions",{access_token:accessToken,start_date:startDate,end_date:endDate,count}); }
  async plaidGetItem(accessToken) { return this._request("POST","api/v2/plaid/item",{access_token:accessToken}); }
  async plaidRemoveItem(accessToken) { return this._request("POST","api/v2/plaid/item/remove",{access_token:accessToken}); }
  async plaidGetInstitution(institutionId) { return this._request("GET",`api/v2/plaid/institutions/${institutionId}`); }
  async getPaymentsStatus() { return this._request("GET","api/v2/payments/status"); }

}

module.exports = RoutingAPIClient;
