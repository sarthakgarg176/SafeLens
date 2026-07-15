# Backend Integration Checklist

This checklist ensures the SafeLens Backend integrates seamlessly with the completed AI + Extension module.

---

# 1. Native Messaging

- [ ] Native Messaging Host installed
- [ ] Native Host manifest configured correctly
- [ ] Host path verified
- [ ] Extension can establish connection
- [ ] Connection automatically reconnects after restart

---

# 2. CORS Configuration

- [ ] Allow Extension Origin

```
chrome-extension://<extension-id>
```

- [ ] Reject unknown origins
- [ ] Allow required HTTP methods
- [ ] Allow multipart/form-data requests

---

# 3. Image Upload Handling

- [ ] Accept multipart/form-data
- [ ] Validate image MIME types
- [ ] Reject unsupported formats
- [ ] Handle files larger than configured limit
- [ ] Store temporary uploads safely

---

# 4. Hash Generation

IMPORTANT

- [ ] Generate pHash from ORIGINAL image
- [ ] Generate wHash from ORIGINAL image
- [ ] Never generate hashes from blurred image
- [ ] Never generate hashes from watermarked image

---

# 5. Database

Verify schema matches project documentation.

## assets

- [ ] filename
- [ ] source_website
- [ ] thumbnail_path
- [ ] phash
- [ ] whash
- [ ] watermark_id
- [ ] confidence_before
- [ ] confidence_after
- [ ] status
- [ ] timestamp

## alerts

- [ ] asset_id
- [ ] matched_url
- [ ] match_confidence
- [ ] severity
- [ ] status
- [ ] timestamp

## actions

- [ ] alert_id
- [ ] action_type
- [ ] status
- [ ] timestamp

## users (optional)

- [ ] username
- [ ] email
- [ ] api_key

---

# 6. API Endpoints

Implement exactly these endpoints.

```
GET    /api/health

POST   /api/scan

POST   /api/protect

GET    /api/dashboard

GET    /api/assets

GET    /api/assets/{id}

GET    /api/incidents

GET    /api/incidents/{id}

POST   /api/incidents/{id}/decision

POST   /api/report
```

---

# 7. Request Validation

- [ ] Validate required fields
- [ ] Return meaningful errors
- [ ] Reject invalid payloads
- [ ] Validate image exists
- [ ] Validate image type

---

# 8. Response Schema

Every endpoint should return

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "timestamp": "UTC"
}
```

Errors

```json
{
  "success": false,
  "error": "...",
  "code": "...",
  "timestamp": "UTC"
}
```

---

# 9. Time

- [ ] Store timestamps in UTC
- [ ] Convert to local timezone only in frontend

---

# 10. Security

- [ ] Encrypt sensitive metadata
- [ ] Validate file uploads
- [ ] Prevent SQL Injection
- [ ] Prevent Path Traversal
- [ ] Validate filenames
- [ ] Never trust client input

---

# 11. Logging

- [ ] API errors
- [ ] Protection requests
- [ ] Incident creation
- [ ] Report generation
- [ ] Backend exceptions

---

# 12. Dashboard Compatibility

Verify dashboard receives exactly the expected data.

- [ ] Dashboard Summary
- [ ] Assets
- [ ] Incidents
- [ ] Reports
- [ ] Settings

---

# 13. Extension Compatibility

Backend must work with the completed Extension.

Verify:

- [ ] Native Messaging works
- [ ] Upload pipeline works
- [ ] Protect endpoint works
- [ ] Hashes returned correctly
- [ ] Metadata returned correctly

---

# 14. Manual Tests

- [ ] Normal image upload
- [ ] Large image
- [ ] Corrupted image
- [ ] Unsupported image
- [ ] Multiple uploads
- [ ] Duplicate upload
- [ ] Backend restart
- [ ] Native Host restart

---

# 15. Final Integration

Verify complete pipeline

```
Extension

↓

Native Messaging

↓

Backend

↓

SQLite

↓

Response

↓

Extension

↓

Dashboard
```

---

# Definition of Done

Backend is considered complete only if:

- [ ] All API endpoints implemented
- [ ] Database schema matches documentation
- [ ] Extension communicates successfully
- [ ] Dashboard consumes APIs successfully
- [ ] Build passes
- [ ] Manual tests pass
- [ ] No blocking integration issues remain