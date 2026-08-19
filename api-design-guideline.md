# API Design & Data Representation Guidelines

**Document status:** Team Standard
**Version:** 1.0
**Scope:** HTTP/REST APIs and JSON-based service communication
**Audience:** Backend, frontend, mobile, QA, data, and integration engineers

---

## 1. Purpose

This document defines the conventions that all APIs within the project should follow when representing data and communicating between services and client applications.

The goal is to ensure that:

- frontend and backend developers interpret data consistently;
- different services use the same representation for the same concept;
- APIs are predictable and easy to consume;
- data can be processed by machines without relying on presentation-specific formatting;
- international standards are reused whenever practical;
- API consumers do not need to guess the meaning, unit, timezone, precision, or format of a value.

This document is primarily concerned with **how data should be represented**, rather than defining every individual API endpoint.

For example, an API contract may say:

```json
{
  "createdAt": "2026-08-19T00:30:00Z",
  "price": {
    "amount": 125000,
    "currency": "IDR"
  }
}
```

This guideline explains **why and how** `createdAt`, `amount`, and `currency` should be represented.

---

# 2. Guiding Principles

## 2.1 Prefer established standards

When a well-established standard exists, use it instead of creating a project-specific format.

Preferred:

```json
{
  "currency": "USD"
}
```

instead of:

```json
{
  "currency": "US Dollar"
}
```

Preferred:

```json
{
  "createdAt": "2026-08-19T00:30:00Z"
}
```

instead of:

```json
{
  "createdAt": "19/08/2026 07:30"
}
```

The API should communicate **machine-readable data**, not UI formatting.

---

## 2.2 Separate data from presentation

APIs should provide the semantic value of data rather than a value formatted specifically for a particular user interface.

Do not:

```json
{
  "price": "$1,250.00"
}
```

Prefer:

```json
{
  "price": {
    "amount": 125000,
    "currency": "USD"
  }
}
```

The frontend can then display:

```text
$1,250.00
```

or:

```text
USD 1,250.00
```

or a localized representation.

The backend should generally not determine how a value is visually presented unless presentation itself is part of the business requirement.

---

## 2.3 Be explicit about ambiguity

A value should contain enough information for the consumer to understand what it means.

Bad:

```json
{
  "temperature": 30
}
```

Better:

```json
{
  "temperature": 30,
  "temperatureUnit": "CELSIUS"
}
```

Even better when the API establishes a global unit convention:

```json
{
  "temperatureCelsius": 30
}
```

or:

```json
{
  "temperature": {
    "value": 30,
    "unit": "CELSIUS"
  }
}
```

The appropriate representation depends on the API's needs, but the important principle is:

> Never make the consumer guess the unit or semantic meaning of a value.

---

# 3. JSON General Rules

Unless otherwise specified, APIs should use JSON for request and response bodies.

## 3.1 JSON types

Use native JSON types whenever possible.

| Semantic type | JSON representation                      |
| ------------- | ---------------------------------------- |
| String        | JSON string                              |
| Integer       | JSON number without fractional component |
| Decimal       | JSON number, subject to precision rules  |
| Boolean       | JSON `true` / `false`                    |
| Null          | JSON `null`                              |
| Array         | JSON array                               |
| Object        | JSON object                              |

Do not encode native values unnecessarily as strings.

Bad:

```json
{
  "age": "25",
  "active": "true",
  "count": "100"
}
```

Prefer:

```json
{
  "age": 25,
  "active": true,
  "count": 100
}
```

---

# 4. Naming Conventions

## 4.1 JSON field names

Use `camelCase` for JSON property names.

Preferred:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-08-19T00:30:00Z"
}
```

Avoid:

```json
{
  "first_name": "John",
  "last_name": "Doe"
}
```

and:

```json
{
  "FirstName": "John"
}
```

---

## 4.2 Boolean fields

Boolean fields should normally use names that clearly communicate a yes/no state.

Preferred:

```json
{
  "isActive": true,
  "isVerified": false
}
```

or:

```json
{
  "hasChildren": true,
  "canEdit": false
}
```

Avoid ambiguous names such as:

```json
{
  "status": true
}
```

when the meaning of `true` is not immediately obvious.

For enumerated states, use an enum instead:

```json
{
  "status": "active"
}
```

rather than:

```json
{
  "isActive": true
}
```

when multiple states exist.

---

# 5. Date and Time

Date/time handling is one of the most important API conventions.

## 5.1 Date-only values

When the value represents only a calendar date and does not represent a specific moment in time, use:

```text
YYYY-MM-DD
```

Example:

```json
{
  "birthDate": "2001-05-23"
}
```

Do not use:

```json
{
  "birthDate": "23/05/2001"
}
```

or:

```json
{
  "birthDate": "05/23/2001"
}
```

The latter formats are locale-dependent.

---

## 5.2 Date-time values

For an exact moment in time, use an RFC 3339-compatible timestamp.

Preferred:

```json
{
  "createdAt": "2026-08-19T00:30:00Z"
}
```

or, when an explicit offset is meaningful:

```json
{
  "createdAt": "2026-08-19T07:30:00+07:00"
}
```

The `Z` suffix indicates UTC.

RFC 3339 defines a standardized Internet timestamp representation.

---

## 5.3 Prefer UTC for system timestamps

For timestamps representing system events, APIs should normally transmit UTC.

Preferred:

```json
{
  "createdAt": "2026-08-19T00:30:00Z"
}
```

rather than:

```json
{
  "createdAt": "2026-08-19T07:30:00"
}
```

The second example has no timezone information and is therefore ambiguous.

A timestamp without timezone information should not be used when the value represents an absolute point in time.

---

## 5.4 Date-only vs timestamp

Do not confuse:

```text
2026-08-19
```

with:

```text
2026-08-19T00:00:00Z
```

They have different meanings.

The first means:

> The calendar date August 19, 2026.

The second means:

> A specific instant in time.

For example:

```json
{
  "birthday": "2001-05-23"
}
```

should be a date.

Whereas:

```json
{
  "createdAt": "2026-08-19T00:30:00Z"
}
```

should be a timestamp.

---

## 5.5 Timezone-aware business events

Some business concepts are inherently associated with a timezone.

For example:

```json
{
  "storeOpeningTime": "09:00:00",
  "timezone": "Asia/Jakarta"
}
```

A time-of-day should not automatically be converted to UTC if it represents a recurring local business time.

For example:

> The store opens at 09:00 in Jakarta.

This is different from:

> The store opened at a specific instant.

Use an appropriate representation for the semantic meaning of the data.

---

## 5.6 Timezone identifiers

When an application needs to identify a timezone, use an IANA Time Zone Database identifier.

Examples:

```text
Asia/Jakarta
Asia/Tokyo
Europe/London
America/New_York
UTC
```

Do not use:

```text
GMT+7
WIB
Jakarta Time
```

as the canonical machine-readable timezone identifier when a full timezone identifier is required.

---

# 6. Duration

A duration represents an amount of elapsed time rather than a point in time.

For example:

```json
{
  "durationSeconds": 3600
}
```

or:

```json
{
  "duration": "PT1H"
}
```

The project must choose one convention.

For APIs where simple machine processing is important, integer seconds or milliseconds are often easier:

```json
{
  "timeoutSeconds": 30
}
```

Do not use ambiguous values such as:

```json
{
  "timeout": 30
}
```

unless the unit is explicitly defined by the contract.

---

# 7. Currency and Monetary Values

Money requires special care because floating-point numbers can introduce precision problems.

## 7.1 Currency codes

Use ISO 4217 three-letter currency codes.

Examples:

```text
IDR
USD
EUR
JPY
GBP
SGD
```

Example:

```json
{
  "currency": "IDR"
}
```

ISO 4217 defines internationally recognized currency codes and also specifies information about minor units for currencies that use them.

---

## 7.2 Never include currency symbols in machine-readable amounts

Do not:

```json
{
  "price": "$1,250.00"
}
```

Do not:

```json
{
  "price": "Rp125.000"
}
```

Prefer:

```json
{
  "amount": 125000,
  "currency": "IDR"
}
```

The frontend is responsible for formatting the amount for display.

---

## 7.3 Recommended monetary representation

For financial values, prefer an integer representation using the currency's smallest applicable unit when practical.

Example:

```json
{
  "amount": 1099,
  "currency": "USD"
}
```

where the API contract defines `amount` as cents.

For IDR:

```json
{
  "amount": 125000,
  "currency": "IDR"
}
```

The exact minor-unit policy must be documented because currencies do not all have the same decimal structure.

---

## 7.4 Do not use floating-point for financial calculations

Avoid:

```json
{
  "amount": 10.99
}
```

when the value is intended to be used for exact financial calculations and the implementation uses binary floating-point.

Prefer an integer representation where appropriate:

```json
{
  "amount": 1099,
  "currency": "USD"
}
```

Alternatively, a decimal string may be used when arbitrary decimal precision is required:

```json
{
  "amount": "10.99",
  "currency": "USD"
}
```

The project must choose one approach consistently.

---

## 7.5 Money with arithmetic

Never assume that:

```text
amount = price × quantity
```

can safely be represented using ordinary floating-point arithmetic.

Financial calculations should use an appropriate decimal/integer representation.

The API contract should document:

- precision;
- scale;
- currency;
- rounding rules;
- whether values represent major or minor currency units.

---

# 8. Numbers and Precision

## 8.1 Integer

Use JSON numbers for integers:

```json
{
  "quantity": 10
}
```

Do not:

```json
{
  "quantity": "10"
}
```

unless the number can exceed the safe numeric range of the target clients or another specific reason exists.

---

## 8.2 Large integers

JavaScript's `Number` type cannot safely represent every integer above `2^53 - 1`.

Therefore, identifiers or numeric values potentially exceeding this range should not automatically be exposed as JSON numbers.

For example:

```json
{
  "id": "9223372036854775807"
}
```

may be safer than:

```json
{
  "id": 9223372036854775807
}
```

This is particularly important when backend databases use 64-bit integer IDs and JavaScript clients consume the API.

---

## 8.3 Decimal values

Document precision explicitly.

Bad:

```json
{
  "percentage": 0.1234
}
```

What does it mean?

- 0.1234%?
- 12.34%?
- 0.1234 as a ratio?

Prefer an explicitly documented convention.

For example:

```json
{
  "ratio": 0.1234
}
```

or:

```json
{
  "percentage": 12.34
}
```

with the contract defining:

> `percentage` is expressed as a value between 0 and 100.

---

# 9. Percentages and Ratios

The API must distinguish between:

### Percentage

```json
{
  "discountPercentage": 15
}
```

Meaning:

```text
15%
```

### Ratio

```json
{
  "discountRatio": 0.15
}
```

Meaning:

```text
15%
```

Both are valid representations, but they must not be mixed across endpoints.

Recommended project convention:

```text
percentage → 0 to 100
ratio      → 0 to 1
```

Document the convention globally.

---

# 10. Units of Measurement

Every physical measurement must have a defined unit.

Examples include:

- distance;
- weight;
- temperature;
- area;
- volume;
- speed;
- energy;
- power;
- pressure;
- voltage;
- current.

Avoid:

```json
{
  "distance": 100
}
```

Prefer:

```json
{
  "distanceMeters": 100
}
```

or:

```json
{
  "distance": {
    "value": 100,
    "unit": "m"
  }
}
```

---

## 10.1 Recommended unit convention

For internal APIs, prefer a single canonical unit whenever practical.

For example:

```text
distance → meters
mass → kilograms
temperature → Celsius
volume → liters
energy → joules
power → watts
time duration → seconds
```

The API may expose different units when required by the business domain, but the convention must be explicit.

---

## 10.2 Do not embed units into arbitrary strings

Avoid:

```json
{
  "weight": "10 kg"
}
```

Prefer:

```json
{
  "weightKg": 10
}
```

or:

```json
{
  "weight": {
    "value": 10,
    "unit": "kg"
  }
}
```

---

# 11. Country Codes

When a country needs to be represented by a standardized identifier, use ISO 3166-1 alpha-2 codes.

Examples:

```text
ID
US
JP
SG
GB
AU
```

Example:

```json
{
  "countryCode": "ID"
}
```

Do not use country names as the canonical identifier:

```json
{
  "country": "Indonesia"
}
```

Country names can change according to language and presentation requirements.

---

# 12. Language Codes

Use BCP 47 language tags where language or locale needs to be identified.

Examples:

```text
id
en
en-US
en-GB
id-ID
ja-JP
```

Example:

```json
{
  "language": "id-ID"
}
```

Language identifiers should not be treated as arbitrary project-specific strings.

---

# 13. Locale

A locale represents language plus regional conventions.

Examples:

```text
en-US
en-GB
id-ID
ja-JP
```

Do not confuse:

```text
timezone
```

with:

```text
locale
```

For example:

```json
{
  "locale": "id-ID",
  "timezone": "Asia/Jakarta"
}
```

These represent different concepts.

---

# 14. UUIDs and Identifiers

When UUIDs are used, follow the UUID specification rather than inventing a custom identifier format.

Example:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

UUIDs are 128-bit identifiers standardized by the IETF.

The current UUID specification is RFC 9562, which also defines newer UUID versions including UUIDv6 and UUIDv7.

---

## 14.1 Do not expose database implementation unnecessarily

The API should not necessarily expose:

```text
PostgreSQL BIGSERIAL
MySQL AUTO_INCREMENT
MongoDB ObjectId
```

simply because that is how the database internally identifies records.

The external identifier should be selected based on API requirements.

---

## 14.2 Identifier semantics

An identifier should identify an entity.

Do not encode business meaning into IDs unless there is a strong reason.

Avoid:

```text
USER-ID-JKT-2026-000123
```

unless the business explicitly requires such a human-readable identifier.

Prefer:

```text
550e8400-e29b-41d4-a716-446655440000
```

for a technical identifier and, if necessary, have a separate business identifier:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerNumber": "CUS-000123"
}
```

---

# 15. URLs and URIs

URLs/URIs should use standard URI syntax.

When a URL is transmitted as data:

```json
{
  "website": "https://example.com"
}
```

Do not create arbitrary URL formats.

For API paths, use resource-oriented naming.

Prefer:

```text
GET /users/123
```

rather than:

```text
GET /getUser?id=123
```

---

# 16. Email Addresses

Email addresses should be represented as strings.

Example:

```json
{
  "email": "user@example.com"
}
```

Do not create custom structures unless the domain requires additional information:

```json
{
  "email": {
    "value": "user@example.com",
    "verified": true
  }
}
```

When validation is required, the API should define what constitutes an acceptable email address rather than assuming that every theoretically valid email address is accepted by the application.

---

# 17. Phone Numbers

Phone numbers should not be stored or transmitted primarily as display-formatted strings.

Prefer the international E.164 representation when a canonical phone number is required.

Example:

```json
{
  "phoneNumber": "+628123456789"
}
```

Avoid making the canonical representation:

```json
{
  "phoneNumber": "0812-3456-789"
}
```

The frontend can format the number for display.

---

# 18. IP Addresses

Represent IP addresses as strings.

IPv4:

```json
{
  "ipAddress": "192.168.1.10"
}
```

IPv6:

```json
{
  "ipAddress": "2001:db8::1"
}
```

Do not represent IP addresses as arbitrary integers unless a specialized protocol requires it.

---

# 19. Enumerations

Use stable machine-readable enum values.

Preferred:

```json
{
  "status": "pending"
}
```

rather than:

```json
{
  "status": "Pending Approval"
}
```

The second value is presentation-oriented and may need to change when the UI language changes.

---

## 19.1 Enum naming

Use lowercase `snake_case` or lowercase strings consistently.

Recommended:

```text
pending
in_progress
completed
cancelled
```

Avoid mixing styles:

```text
Pending
inProgress
COMPLETED
cancelled
```

---

## 19.2 Never assume enum values are exhaustive forever

Clients should generally handle unknown enum values gracefully.

For example, if the backend later adds:

```text
archived
```

an old frontend should not crash simply because it received a value it does not recognize.

---

# 20. Null, Missing, and Empty Values

These three states can have different meanings:

```json
{}
```

```json
{
  "middleName": null
}
```

```json
{
  "middleName": ""
}
```

They should not be treated as automatically equivalent.

Recommended distinction:

### Missing

The field does not apply, was not requested, or is intentionally omitted.

### `null`

The field applies to the resource, but currently has no value.

### Empty string

The field has a string value whose length is zero.

For example:

```json
{
  "deletedAt": null
}
```

can mean:

> This record has not been deleted.

Whereas omission may mean:

> The endpoint does not return deletion information.

The project should establish consistent rules for nullable and optional fields.

---

# 21. Collections

Collections should always use arrays.

```json
{
  "users": [
    {
      "id": "..."
    },
    {
      "id": "..."
    }
  ]
}
```

Do not return:

```json
{
  "users": {
    "1": {...},
    "2": {...}
  }
}
```

unless the object/map semantics are explicitly required.

---

# 22. Pagination

Collection endpoints should define pagination consistently.

For offset-based pagination:

```http
GET /users?page=2&limit=20
```

Example:

```json
{
  "data": [
    {
      "id": "..."
    }
  ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 152
  }
}
```

For large or frequently changing datasets, cursor-based pagination may be preferable:

```http
GET /users?limit=20&cursor=eyJpZCI6MTIzfQ==
```

Example:

```json
{
  "data": [],
  "pagination": {
    "nextCursor": "eyJpZCI6MTQzfQ==",
    "hasNext": true
  }
}
```

The project should select one primary pagination strategy rather than allowing every endpoint to invent its own.

---

# 23. Sorting and Filtering

Use predictable query parameters.

Example:

```http
GET /products?status=active&sort=-createdAt
```

or:

```http
GET /products?status=active&sortBy=createdAt&sortOrder=desc
```

The project should standardize the syntax.

Do not allow endpoint-specific variations such as:

```text
?order=descending
?direction=DESC
?sortOrder=desc
?sort_direction=down
```

unless there is a clear reason.

---

# 24. Error Representation

Errors should have a consistent structure.

Recommended:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "email": ["Email address is invalid."]
    }
  }
}
```

The error should contain:

- a stable machine-readable code;
- a human-readable message;
- optional structured details.

The frontend should primarily depend on:

```text
error.code
```

rather than parsing:

```text
error.message
```

---

## 24.1 Do not make error messages API contracts

Bad frontend logic:

```text
if message == "User already exists"
```

Prefer:

```text
if error.code == "USER_ALREADY_EXISTS"
```

Human-readable messages may change.

Machine-readable error codes should remain stable.

---

# 25. HTTP Status Codes

Use HTTP status codes according to their semantics.

Common conventions:

| Status                      | Meaning                                                 |
| --------------------------- | ------------------------------------------------------- |
| `200 OK`                    | Successful request                                      |
| `201 Created`               | Resource successfully created                           |
| `202 Accepted`              | Request accepted for asynchronous processing            |
| `204 No Content`            | Successful request with no response body                |
| `400 Bad Request`           | Invalid request syntax/structure                        |
| `401 Unauthorized`          | Authentication required/invalid                         |
| `403 Forbidden`             | Authenticated but not allowed                           |
| `404 Not Found`             | Resource does not exist                                 |
| `409 Conflict`              | Request conflicts with current state                    |
| `422 Unprocessable Content` | Request is syntactically valid but semantically invalid |
| `429 Too Many Requests`     | Rate limit exceeded                                     |
| `500 Internal Server Error` | Unexpected server failure                               |
| `502 Bad Gateway`           | Invalid upstream response                               |
| `503 Service Unavailable`   | Service temporarily unavailable                         |

Do not return `200` for every situation and put the actual error only inside the JSON body.

---

# 26. IDs vs Human-Readable Names

Do not use human-readable names as technical identifiers unless they are explicitly designed to be stable.

Avoid:

```json
{
  "departmentId": "software-engineering"
}
```

if the department name/slug can change.

Prefer:

```json
{
  "departmentId": "550e8400-e29b-41d4-a716-446655440000",
  "departmentName": "Software Engineering"
}
```

The identifier and presentation name should have separate responsibilities.

---

# 27. Addresses

Addresses are difficult to standardize globally.

Do not assume that one country's address structure works for every country.

Avoid forcing every address into:

```json
{
  "street": "...",
  "city": "...",
  "state": "...",
  "zipCode": "..."
}
```

without considering international requirements.

A practical structure may be:

```json
{
  "addressLine1": "Jl. Example No. 123",
  "addressLine2": null,
  "city": "Malang",
  "region": "East Java",
  "postalCode": "65145",
  "countryCode": "ID"
}
```

Use standardized country codes and keep address formatting flexible enough for the supported countries.

---

# 28. Geographic Coordinates

Use decimal degrees for latitude and longitude.

Example:

```json
{
  "latitude": -7.9839,
  "longitude": 112.6214
}
```

Always document the coordinate reference system.

For ordinary GPS geographic coordinates, WGS 84 is generally expected.

Do not return:

```json
{
  "latitude": "-7° 59' 02\""
}
```

unless the API specifically needs a human-readable representation.

---

# 29. File Sizes

Represent file sizes using bytes when a precise machine-readable size is required.

Example:

```json
{
  "sizeBytes": 1048576
}
```

Avoid:

```json
{
  "size": "1 MB"
}
```

The latter is presentation-oriented and can introduce ambiguity around decimal vs binary units.

---

# 30. File MIME Types

Use standard media types where a MIME type is required.

Example:

```json
{
  "contentType": "application/pdf"
}
```

Examples:

```text
application/json
application/pdf
image/jpeg
image/png
text/plain
```

Do not invent values such as:

```text
pdf-file
jpg-image
json-data
```

---

# 31. Binary Data

Do not put arbitrary binary data directly into JSON.

Prefer:

```json
{
  "fileUrl": "https://example.com/files/123"
}
```

or use multipart/form-data for file upload APIs.

If binary data genuinely needs to be embedded inside JSON, explicitly define the encoding, such as Base64.

Example:

```json
{
  "content": "SGVsbG8gV29ybGQ="
}
```

The API contract must clearly state that the field is Base64 encoded.

---

# 32. Security-Sensitive Values

Never return sensitive information simply because it exists in the database.

Examples that should generally not be exposed:

```text
password
password hash
authentication secret
private key
database credential
internal service credential
session secret
```

Do not return password hashes:

```json
{
  "passwordHash": "$2b$..."
}
```

Even though the hash is not the original password, it is still sensitive information.

---

# 33. Tokens

Authentication tokens should be treated as security-sensitive values.

Do not include access tokens in ordinary resource representations:

```json
{
  "user": {
    "id": "...",
    "accessToken": "..."
  }
}
```

Authentication mechanisms should have their own explicit contract.

---

# 34. API Versioning

Breaking changes should not silently change the meaning of existing fields.

For example, changing:

```json
{
  "price": 100
}
```

from:

> price in USD

to:

> price in IDR

without changing the contract is unacceptable.

Semantic meaning is part of the API contract.

Breaking changes should use an explicit versioning strategy.

Possible strategies include:

```text
/api/v1/users
/api/v2/users
```

or header/content-negotiation based versioning.

The project should choose one strategy and apply it consistently.

---

# 35. Backward Compatibility

API changes should generally follow this rule:

> Adding information is usually safer than changing the meaning of existing information.

Usually safe:

```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "phone": "..."
}
```

when `phone` is newly added and clients tolerate unknown fields.

Potentially breaking:

```json
{
  "id": 123
}
```

changing into:

```json
{
  "id": "123"
}
```

because the type changed.

Also potentially breaking:

```text
createdAt: timestamp
```

changing to:

```text
createdAt: date-only
```

Even if the JSON field name remains identical.

---

# 36. Field Semantics Are Part of the Contract

A field definition should specify more than its JSON type.

For example, this is insufficient:

```text
price: number
```

A proper definition should clarify:

```text
price:
  type: integer
  meaning: monetary amount
  unit: minor currency unit
  currency: specified separately using ISO 4217
  nullable: false
```

Similarly:

```text
createdAt:
  type: string
  format: RFC 3339
  timezone: UTC
  meaning: time at which the resource was created
```

This is the level of precision expected from a good API contract.

---

# 37. Recommended Standard Data Dictionary

Every significant shared data type should have a definition similar to this:

| Field            | Type    | Format     | Unit       | Nullable | Example                | Notes                 |
| ---------------- | ------- | ---------- | ---------- | -------- | ---------------------- | --------------------- |
| `id`             | string  | UUID       | —          | No       | `550e8400-...`         | Technical identifier  |
| `createdAt`      | string  | RFC 3339   | —          | No       | `2026-08-19T00:30:00Z` | UTC timestamp         |
| `birthDate`      | string  | ISO date   | —          | Yes      | `2001-05-23`           | Calendar date         |
| `price.amount`   | integer | —          | minor unit | No       | `125000`               | Exact monetary amount |
| `price.currency` | string  | ISO 4217   | —          | No       | `IDR`                  | Currency code         |
| `countryCode`    | string  | ISO 3166-1 | —          | No       | `ID`                   | Country               |
| `language`       | string  | BCP 47     | —          | No       | `id-ID`                | Language/locale       |
| `latitude`       | number  | decimal    | degrees    | No       | `-7.9839`              | WGS 84                |
| `longitude`      | number  | decimal    | degrees    | No       | `112.6214`             | WGS 84                |
| `fileSizeBytes`  | integer | —          | bytes      | No       | `1048576`              | File size             |

---

# 38. Recommended Canonical Representations

The following conventions are recommended as the project's default.

| Concept            | Canonical representation                                       |
| ------------------ | -------------------------------------------------------------- |
| Date               | `YYYY-MM-DD`                                                   |
| Timestamp          | RFC 3339                                                       |
| System timestamp   | RFC 3339 UTC                                                   |
| Timezone           | IANA timezone identifier                                       |
| Duration           | Integer seconds or explicitly defined duration format          |
| Currency           | ISO 4217                                                       |
| Money              | Integer minor units + ISO 4217 currency                        |
| Country            | ISO 3166-1 alpha-2                                             |
| Language           | BCP 47                                                         |
| UUID               | Standard UUID representation                                   |
| URL/URI            | Standard URI syntax                                            |
| Email              | String                                                         |
| Phone              | E.164 where canonical international representation is required |
| IPv4/IPv6          | String                                                         |
| Latitude/longitude | Decimal degrees, WGS 84                                        |
| File size          | Integer bytes                                                  |
| MIME type          | IANA media type                                                |
| Boolean            | JSON boolean                                                   |
| Enum               | Stable lowercase machine-readable string                       |
| Percentage         | `0–100`, unless otherwise documented                           |
| Ratio              | `0–1`                                                          |
| Null               | JSON `null`                                                    |
| Collection         | JSON array                                                     |

---

# 39. Data Representation Anti-Patterns

## 39.1 Presentation-formatted data

Avoid:

```json
{
  "price": "Rp 125.000",
  "date": "19 August 2026",
  "distance": "12.5 km"
}
```

Prefer:

```json
{
  "price": {
    "amount": 125000,
    "currency": "IDR"
  },
  "date": "2026-08-19",
  "distanceMeters": 12500
}
```

---

## 39.2 Ambiguous numbers

Avoid:

```json
{
  "timeout": 30
}
```

Prefer:

```json
{
  "timeoutSeconds": 30
}
```

---

## 39.3 Ambiguous timestamps

Avoid:

```json
{
  "createdAt": "2026-08-19 07:30:00"
}
```

Prefer:

```json
{
  "createdAt": "2026-08-19T00:30:00Z"
}
```

---

## 39.4 Boolean strings

Avoid:

```json
{
  "active": "true"
}
```

Prefer:

```json
{
  "active": true
}
```

---

## 39.5 Currency symbols

Avoid:

```json
{
  "price": "$100"
}
```

Prefer:

```json
{
  "price": {
    "amount": 10000,
    "currency": "USD"
  }
}
```

assuming the project defines the amount as cents.

---

## 39.6 Database-specific serialization

Avoid exposing internal database representations simply because they are convenient.

For example, do not make the API contract depend on a particular ORM's serialization behavior.

The API representation should be intentionally designed.

---

# 40. API Design Decision Hierarchy

When deciding how to represent a new type of data, use this order:

```text
1. Is there an established international/technical standard?
                ↓
              YES
                ↓
       Use the standard.

                ↓ NO

2. Is there a strong industry convention?
                ↓
              YES
                ↓
       Prefer the convention.

                ↓ NO

3. Does the project already have a convention?
                ↓
              YES
                ↓
       Follow the project convention.

                ↓ NO

4. Define a new project convention.
                ↓
       Document it explicitly.
```

Do not invent a new format merely because it is convenient for one endpoint.

---

# 41. Standard vs Project Convention

Not every rule in this document is an external standard.

This distinction is important.

### External standard

Examples:

```text
RFC 3339
ISO 4217
ISO 3166
BCP 47
UUID specification
URI specification
```

These provide standardized representations that should generally be reused.

### Project convention

Examples:

```text
JSON uses camelCase
Money uses integer minor units
Percentages use 0–100
Pagination uses cursor-based pagination
Error objects use { error: { code, message, details } }
```

These are design decisions made by the project.

The project is allowed to choose differently when there is a legitimate reason.

---

# 42. Exceptions

A team may deviate from this guideline when a legitimate technical or business requirement exists.

Examples:

- legacy API compatibility;
- third-party API compatibility;
- regulatory requirements;
- domain-specific standards;
- performance requirements;
- interoperability requirements.

Exceptions should be documented.

For example:

```text
Exception:
The payment integration requires monetary values as decimal strings
because the external provider does not accept integer minor units.

Affected API:
POST /payments

Representation:
amount: string

Reason:
Third-party payment provider compatibility.
```

An exception should never exist only as tribal knowledge.

---

# 43. Recommended API Review Checklist

Before introducing a new API field, ask:

### General

- [ ] Is the field name unambiguous?
- [ ] Is the JSON type appropriate?
- [ ] Is the field machine-readable?
- [ ] Is presentation logic separated from data?
- [ ] Is nullability defined?
- [ ] Is the field optional or required?

### Date/time

- [ ] Is this a date, time, or timestamp?
- [ ] Does the timestamp include timezone information?
- [ ] Is RFC 3339 used for timestamps?
- [ ] Is UTC used for system timestamps?
- [ ] Is the timezone explicitly defined where necessary?

### Money

- [ ] Is the currency explicitly represented?
- [ ] Is the currency code ISO 4217?
- [ ] Is the monetary representation precise?
- [ ] Are floating-point calculations avoided?
- [ ] Is the minor/major unit convention documented?

### Numbers

- [ ] Is the unit clear?
- [ ] Is precision defined?
- [ ] Could the number exceed JavaScript's safe integer range?
- [ ] Is a decimal string required instead?

### Localization

- [ ] Is the country represented using a standardized country code?
- [ ] Is the language represented using BCP 47?
- [ ] Is locale separated from timezone?

### Enums

- [ ] Are enum values stable?
- [ ] Are they machine-readable?
- [ ] Can old clients tolerate future values?

### Compatibility

- [ ] Will this change break existing clients?
- [ ] Is the field's semantic meaning stable?
- [ ] Is the change backward compatible?
- [ ] Does the API version need to change?

---

# 44. Example: Good API Representation

A well-designed response might look like:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Example Product",
  "status": "active",
  "price": {
    "amount": 125000,
    "currency": "IDR"
  },
  "weight": {
    "value": 1.5,
    "unit": "kg"
  },
  "available": true,
  "countryCode": "ID",
  "language": "id-ID",
  "createdAt": "2026-08-19T00:30:00Z",
  "updatedAt": "2026-08-19T01:00:00Z"
}
```

The important characteristics are:

- timestamps have an unambiguous format;
- money contains both amount and currency;
- units are explicit;
- country uses a standardized code;
- language uses a standardized language tag;
- booleans are actual JSON booleans;
- enum values are machine-readable;
- IDs have a defined format;
- no UI-specific formatting is embedded in the response.

---

# 45. Example: Bad API Representation

Avoid responses such as:

```json
{
  "id": 123,
  "status": "Active Product",
  "price": "Rp 125.000",
  "weight": "1.5 kg",
  "available": "yes",
  "country": "Indonesia",
  "language": "Indonesian",
  "createdAt": "19/08/2026 07:30",
  "updatedAt": "19/08/2026 08:00"
}
```

Problems include:

- ambiguous date/time format;
- no timezone;
- currency embedded in presentation text;
- unit embedded in a string;
- boolean represented as a string;
- country represented by a display name;
- language represented by a display name;
- identifier format not explicitly defined;
- enum value potentially mixed with presentation text.

---

# 46. The Core Philosophy

The API should answer:

> **What is the data?**

The frontend should decide:

> **How should the data be displayed?**

For example, the backend should provide:

```json
{
  "amount": 125000,
  "currency": "IDR"
}
```

The frontend decides whether to display:

```text
Rp125.000
```

or:

```text
IDR 125,000
```

Similarly, the backend should provide:

```json
{
  "createdAt": "2026-08-19T00:30:00Z"
}
```

The frontend decides whether the user sees:

```text
19 Aug 2026, 07:30
```

or:

```text
19/08/2026 07.30
```

The API should provide **semantic truth**, not UI formatting.

---

# 47. Reference Standards

The following standards are particularly relevant to this guideline:

- **RFC 3339** — Date and Time on the Internet: Timestamps
- **RFC 9562** — Universally Unique Identifiers (UUIDs)
- **ISO 4217** — Codes for the representation of currencies
- **ISO 3166-1** — Country codes
- **BCP 47 / RFC 5646** — Language tags
- **RFC 3986** — Uniform Resource Identifier syntax
- **IANA Media Types** — Standard MIME/media types
- **IANA Time Zone Database** — Canonical timezone identifiers

These standards should be preferred over project-specific formats whenever applicable.

---

# 48. Final Rule

When designing a new API field, do not start with:

> "What format is easiest for me to return?"

Start with:

> "What does this value actually mean, and is there an established standard for representing it?"

Then determine:

```text
Meaning
   ↓
Standard representation
   ↓
Project convention
   ↓
JSON representation
   ↓
API contract
   ↓
Frontend implementation
```

This approach keeps the API stable, predictable, interoperable, and understandable across different clients and services.

**An API should be designed as a contract between systems, not as a serialization of the backend's internal data structures.**
