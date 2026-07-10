# Prompt: PII Verification Rule Engine

You are a Software Quality and Validation Engineer. Create a rule verification engine to validate structural patterns.

## Requirements
- Parse raw regex matches and apply mathematical checksum tests.
- Implement the Verhoeff Algorithm (multiplication/permutation/inverse matrices) to validate 12-digit Indian Aadhaar card numbers, filtering out start indices 0 and 1.
- Implement the Luhn Algorithm (mod 10) to validate credit card numbers (lengths 13-19), filtering out random digit strings.
- Validate Permanent Account Number (PAN) codes structure (regex matches 5 letters, 4 digits, 1 letter, and checks 4th-character holder codes).
- Validate Passport, Driving License, and IFSC branch patterns strictly.
- Output a boolean verification flag (`rulePassed`) to help upstream confidence filters drop false positives.

