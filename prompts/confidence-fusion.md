# Prompt: Multi-Modal Confidence Fusion

You are an AI Fusion Architect. Write an algorithm to fuse structural regex detections and semantic classifier topics.

## Requirements
- Parse raw regex pattern coordinates, OCR confidence metrics, and validation flags.
- Drop false positives completely where checksum validation checks (`rulePassed === false`) fail.
- Define a weighted scoring map (e.g. 70% Regex structural confidence + 30% OCR legibility confidence) to produce a `fusedConfidence` value.
- Map matched PII keys to severity indices: Low, Medium, High, and Critical.
- Return unified, high-confidence detections with resolved metadata.

