/**
 * Routing API - Official Node.js Client
 * 
 * Bank lookups, SWIFT codes, IBAN validation, OFAC screening, and more.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface BankInfo {
  routingNumber: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  type: string;
  active: boolean;
  lastUpdated: string;
}

export interface SwiftInfo {
  bic: string;
  bankName: string;
  country: string;
  city: string;
  branch?: string;
}

export interface IbanValidation {
  valid: boolean;
  country: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
  bic?: string;
}

export interface ComplianceScreening {
  riskLevel: 'low' | 'medium' | 'high';
  isBlocked: boolean;
  matches: string[];
}

export interface JapanAccount {
  valid: boolean;
  bankName?: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
  accountType?: string;
  error?: string;
}

export interface KoreaAccount {
  valid: boolean;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  swiftCode?: string;
  error?: string;
}

export interface AustraliaAccount {
  valid: boolean;
  bankName?: string;
  bsb?: string;
  accountNumber?: string;
  state?: string;
  error?: string;
}

export interface ChinaAccount {
  valid: boolean;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  swiftCode?: string;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  achRecords: number;
  wireRecords: number;
  swiftRecords: number;
  ofacRecords: number;
}

export class RoutingAPIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RoutingAPIError';
  }
}

/**
 * Routing API Client for Node.js
 */
export class RoutingAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(
    private apiKey: string,
    baseURL: string = 'http://localhost:8800',
    timeout: number = 30000
  ) {
    this.baseURL = baseURL.replace(/\/$/, '');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'routing-api-client-js/0.1.0',
      },
    });
  }

  private async request<T>(
    method: string,
    endpoint: string,
    params?: any
  ): Promise<T> {
    try {
      const response = await this.client({
        method,
        url: endpoint,
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new RoutingAPIError(
          error.message || 'API request failed',
          error.code
        );
      }
      throw error;
    }
  }

  /**
   * Look up bank information by routing number
   */
  async lookupBank(
    routingNumber: string,
    transferType: 'ach' | 'wire' = 'ach',
    format: 'json' | 'xml' = 'json'
  ): Promise<BankInfo> {
    return this.request('GET', '/bank-information', {
      routing_number: routingNumber,
      transfer_type: transferType,
      format,
    });
  }

  /**
   * Look up SWIFT/BIC code information
   */
  async lookupSwift(bic: string): Promise<SwiftInfo> {
    return this.request('GET', '/swift-lookup', { bic });
  }

  /**
   * Search for SWIFT codes by bank name and/or country
   */
  async searchSwift(
    bankName?: string,
    country?: string
  ): Promise<SwiftInfo[]> {
    const response = await this.request('GET', '/swift-search', {
      bank_name: bankName,
      country,
    });
    return response.results || [];
  }

  /**
   * Validate an IBAN
   */
  async validateIban(iban: string): Promise<IbanValidation> {
    return this.request('GET', '/iban-validate', { iban });
  }

  /**
   * Screen a name for OFAC compliance
   */
  async screenName(
    name: string,
    country?: string
  ): Promise<ComplianceScreening> {
    return this.request('GET', '/compliance/screen', {
      name,
      country,
    });
  }

  /**
   * Validate a Japanese bank account
   */
  async validateJapanAccount(
    bankCode: string,
    branchCode: string,
    accountNumber: string
  ): Promise<JapanAccount> {
    return this.request('GET', '/account/validate-jp', {
      bank_code: bankCode,
      branch_code: branchCode,
      account_number: accountNumber,
    });
  }

  /**
   * Validate a South Korean bank account
   */
  async validateKoreaAccount(
    bankCode: string,
    accountNumber: string
  ): Promise<KoreaAccount> {
    return this.request('GET', '/account/validate-kr', {
      bank_code: bankCode,
      account_number: accountNumber,
    });
  }

  /**
   * Validate an Australian bank account
   */
  async validateAustraliaAccount(
    bsb: string,
    accountNumber: string
  ): Promise<AustraliaAccount> {
    return this.request('GET', '/account/validate-au', {
      bsb,
      account_number: accountNumber,
    });
  }

  /**
   * Validate a Chinese bank account
   */
  async validateChinaAccount(
    bankCode: string,
    accountNumber: string
  ): Promise<ChinaAccount> {
    return this.request('GET', '/account/validate-cn', {
      bank_code: bankCode,
      account_number: accountNumber,
    });
  }

  /**
   * Check API health
   */
  async getHealth(): Promise<HealthStatus> {
    return this.request('GET', '/health');
  }
}

export default RoutingAPIClient;
