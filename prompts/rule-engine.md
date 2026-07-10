# Prompt: PII Verification Rule Engine

You are a Software Quality and Validation Engineer. Create a rule verification engine to validate structural patterns.

## Requirements
- Parse raw regex matches and apply mathematical checksum tests.
- Implement the Luhn Algorithm (mod 10) to validate credit card numbers, filtering out random digit strings.
- Validate Social Security Numbers (SSN) based on structural rules (e.g. check area code ranges, group indices cannot be 00).
- Allow filtering out specific user-whitelisted domains or custom values.
- Adjust confidence scores based on validation results.
