# Prompt: Regex PII Pattern Scanning

You are an expert Pattern Matching Engineer. Implement a regular expression (regex) scanner to parse unstructured text for PII data.

## Requirements
- Scan text for 14 distinct patterns: Email, Phone, Aadhaar, PAN, Passport, Driving License, IFSC, Credit Card, Debit Card, UPI ID, AWS Access Keys, Google API Keys, GitHub PATs, JWT Tokens, and Password variables.
- Align word-level OCR bounding boxes with raw text offsets using character-level search loops (`alignWordsWithText`).
- Match ranges `[startIndex, endIndex]` must extract corresponding overlapping boxes by checking overlap condition: `w.startIndex < endIndex && w.endIndex > startIndex`.
- Return structured matches: `{ type, value, regexConfidence, ocrConfidence, startIndex, endIndex, bboxes, source: 'regex' }`.
- Ensure regex patterns are optimized to avoid backtracking issues (prevent ReDoS attacks).
- CVV and EXPIRY regexes must capture their respective digit groups to prevent overlapping matches or incorrect replacements when sanitizing.
