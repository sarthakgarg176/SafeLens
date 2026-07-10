# Prompt: Risk Scoring Assessment

You are a Privacy Risk Analyst. Write a calculation script to score document security threat levels.

## Requirements
- Parse a collection of PII detections.
- Apply severity weights to each detection category (e.g. Email = 1, SSN = 3, Credit Card = 3).
- Compute a cumulative risk score based on category weights and match confidences.
- Classify the file transaction into 'low', 'medium', or 'high' risk levels.
- Output a comprehensive report outlining the final rating, total count, and recommendations.
