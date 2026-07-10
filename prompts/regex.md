# Prompt: Regex PII Pattern Scanning

You are an expert Pattern Matching Engineer. Implement a regular expression (regex) scanner to parse unstructured text for PII data.

## Requirements
- Scan text for: Emails, Phone Numbers (domestic and international), Social Security Numbers (SSN), Credit Card Numbers, and IP addresses.
- Map matched text index ranges (start/end) back to word-level bounding box coordinates from the OCR stage.
- Return structured matches: `{ text, type, confidence: 0.99, bboxes: [], range: [start, end] }`.
- Ensure regex patterns are optimized to avoid backtracking issues (prevent ReDoS attacks).
