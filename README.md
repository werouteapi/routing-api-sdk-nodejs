# Routing API Node.js Client

Official TypeScript/JavaScript client for the [Routing API](https://routing-api.com) — the most comprehensive bank and payment routing service.

## Features

- **Bank Lookups** - Search by routing number, Swift code, IBAN
- **SWIFT Codes** - 112,000+ BIC/SWIFT codes with bank details
- **IBAN Validation** - Validate and parse IBAN numbers
- **OFAC Screening** - Screen against US Treasury OFAC SDN list
- **Asia-Pacific Support** - Japan, Korea, Australia, China account validation
- **Async/Await** - Native Promise-based API
- **TypeScript** - Full type definitions included
- **ESM & CJS** - Works in modern and legacy projects

## Installation

```bash
npm install routing-api-client
# or
yarn add routing-api-client
# or
pnpm add routing-api-client
```

## Quick Start

```typescript
import { RoutingAPIClient } from 'routing-api-client';

const client = new RoutingAPIClient({
  apiKey: 'your_api_key'
});

// Lookup bank by routing number
const bank = await client.lookupBank('121000245', 'ach');
console.log(bank.name);  // Wells Fargo Bank, Na

// Validate IBAN
const result = await client.validateIban('DE89370400440532013000');
console.log(result.valid);  // true
console.log(result.country);  // DE

// OFAC screening
const screening = await client.screenName('John Smith', 'US');
console.log(screening.riskLevel);  // low
```

## API Methods

### lookupBank()

Look up bank information by routing number.

```typescript
const bank = await client.lookupBank(
  '121000245',
  'ach',  // or 'wire'
  'json'  // or 'xml'
);

// Returns:
// {
//   name: "Wells Fargo Bank, Na",
//   address: "1 Home Street",
//   city: "San Francisco",
//   state: "CA",
//   zip: "94105",
//   phone: "1-800-869-3557",
//   website: "www.wellsfargo.com",
//   type: "Main Office",
//   active: true
// }
```

### lookupSwift()

Look up SWIFT/BIC code information.

```typescript
const swift = await client.lookupSwift('PBNAUS33');

// Returns:
// {
//   bic: "PBNAUS33",
//   bankName: "PITNEY BOWES INC",
//   country: "US",
//   city: "STAMFORD",
//   branch: "MAIN OFFICE"
// }
```

### searchSwift()

Search for SWIFT codes by bank name and/or country.

```typescript
const results = await client.searchSwift({
  bankName: 'Wells',
  country: 'US'
});

// Returns: [
//   { bic: "WFBIUS6S", bankName: "WELLS FARGO BANK", ... },
//   { bic: "WFBIUSA6", bankName: "WELLS FARGO BANK", ... },
//   ...
// ]
```

### validateIban()

Validate an IBAN (International Bank Account Number).

```typescript
const result = await client.validateIban('DE89370400440532013000');

// Returns:
// {
//   valid: true,
//   country: "DE",
//   bic: "COBADEFFXXX",
//   bankCode: "37040044",
//   accountNumber: "0532013000"
// }
```

### screenName()

Screen a name against OFAC SDN list.

```typescript
const result = await client.screenName('Osama Bin Laden', 'US');

// Returns:
// {
//   riskLevel: "high",
//   isBlocked: true,
//   matches: [
//       { name: "Osama Bin Laden", type: "Individual", score: 0.99 }
//   ]
// }
```

### validateJapanAccount()

Validate a Japanese bank account.

```typescript
const result = await client.validateJapanAccount(
  '0005',      // bank code
  '001',       // branch code
  '1234567'    // account number
);

// Returns:
// {
//   valid: true,
//   bankName: "Mizuho Bank",
//   bankCode: "0005",
//   accountType: "Savings"
// }
```

### validateKoreaAccount()

Validate a South Korean bank account.

```typescript
const result = await client.validateKoreaAccount(
  '004',           // bank code
  '12345678901'    // account number
);

// Returns:
// {
//   valid: true,
//   bankName: "KB Kookmin Bank",
//   swiftCode: "KKBKKRSE"
// }
```

### validateAustraliaAccount()

Validate an Australian bank account.

```typescript
const result = await client.validateAustraliaAccount(
  '012-001',       // BSB code
  '123456789'      // account number
);

// Returns:
// {
//   valid: true,
//   bankName: "Westpac Banking Corporation",
//   state: "NSW"
// }
```

### validateChinaAccount()

Validate a Chinese bank account.

```typescript
const result = await client.validateChinaAccount(
  '102100001',     // bank code
  '123456789'      // account number
);

// Returns:
// {
//   valid: true,
//   bankName: "Bank of China",
//   swiftCode: "BKCHUS33"
// }
```

### getHealth()

Check API health status.

```typescript
const health = await client.getHealth();

// Returns:
// {
//   status: "healthy",
//   routingRecords: 15234,
//   swiftRecords: 112456,
//   ibanCountries: 97,
//   ofacRecords: 8532,
//   uptimeSeconds: 3600
// }
```

## Error Handling

```typescript
import { RoutingAPIClient, RoutingAPIError } from 'routing-api-client';

const client = new RoutingAPIClient({ apiKey: 'your_api_key' });

try {
  const bank = await client.lookupBank('invalid');
} catch (error) {
  if (error instanceof RoutingAPIError) {
    console.error('API Error:', error.message);
  } else {
    throw error;
  }
}
```

## Configuration

### Custom Base URL

```typescript
const client = new RoutingAPIClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.routing-api.com'
});
```

### Custom Timeout

```typescript
const client = new RoutingAPIClient({
  apiKey: 'your_api_key',
  timeout: 60000  // milliseconds
});
```

## Requirements

- Node.js 14+
- axios 1.0+

## Development

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Lint and format

```bash
npm run lint
npm run format
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- 📚 [Documentation](https://docs.routing-api.com/nodejs)
- 💬 [Discord Community](https://discord.gg/routing-api)
- 📧 [Email Support](mailto:support@routing-api.com)
- 🐛 [Issue Tracker](https://github.com/routing-api-clients/nodejs-client/issues)

## Changelog

### v0.1.0 (2024-10-02)

- Initial release
- Bank lookups via routing number
- SWIFT code lookups and search
- IBAN validation
- OFAC screening
- Asia-Pacific account validation (JP, KR, AU, CN)
- Full TypeScript support
- Promise-based API
