# Prompt: Risk Scoring Assessment

You are a Privacy Risk Analyst. Write a calculation script to score document security threat levels.

## Requirements
- Parse a collection of fused PII detections.
- Apply severity weights to each detection category (Critical = 10, High = 5, Medium = 2, Low = 1).
- Compute a cumulative risk score by multiplying category weights by fused confidence levels.
- Classify the file transaction into 'low', 'medium', 'high', or 'critical' risk levels.
- Instantly elevate risk rating to 'critical' if any high-confidence (>= 0.70) credential/API key is detected.
- Output a comprehensive report outlining the final rating, total count, and recommendations.

