import { scanTextContent } from './utils/detector.js';
import { evaluateThreatProfile } from './utils/ruleEngine.js';
import { applyCanvasRedaction } from './utils/redactor.js';
import { extractTextFromImage } from './utils/ocr.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log("SafeLens Chrome Extension background service worker initialized.");
});

// Listener for message passing framework
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message from content script or extension UI:", message);

  const { action, payload } = message;

  switch (action) {
    case "START_SCAN":
      console.log("Handling START_SCAN with payload:", payload);
      (async () => {
        try {
          const imageSrc = payload?.image || payload?.imageSrc;
          if (imageSrc) {
            // Step 1: Run the incoming image through extractTextFromImage
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const imageBitmap = await createImageBitmap(blob);
            const textSegments = await extractTextFromImage(imageBitmap);

            // Step 2: Pass the compiled text chunks to scanTextContent regex detector
            const allHits = [];
            const boundingBoxesToRedact = [];

            for (const segment of textSegments) {
              const hits = scanTextContent(segment.text);
              if (hits.length > 0) {
                // Map verified PII hits directly to their respective canvas bounding boxes
                allHits.push(...hits.map(h => ({
                  ...h,
                  boundingBox: segment.boundingBox
                })));
                
                // Add bounding box to redaction list
                boundingBoxesToRedact.push(segment.boundingBox);
              }
            }

            // Step 3: Evaluate the findings through the ruleEngine
            const threatProfile = evaluateThreatProfile(allHits);

            // Step 4: If REDACT_MANDATORY is triggered, immediately invoke applyCanvasRedaction
            let finalImage = imageSrc;
            if (threatProfile.recommendation === "REDACT_MANDATORY" && boundingBoxesToRedact.length > 0) {
              finalImage = await applyCanvasRedaction(imageSrc, boundingBoxesToRedact);
            }

            // Return the final safe base64 image and the computed risk score payload back to the UI
            sendResponse({
              status: "success",
              data: {
                scanId: "scan_" + Date.now(),
                hitsCount: allHits.length,
                hits: allHits.map(h => ({
                  type: h.type,
                  name: h.name,
                  index: h.index,
                  length: h.length,
                  severity: h.severity,
                  boundingBox: h.boundingBox
                })),
                riskScore: threatProfile.riskScore,
                documentContext: threatProfile.documentContext,
                recommendation: threatProfile.recommendation,
                redactedImage: finalImage,
                safeImage: finalImage
              }
            });
          } else {
            // Text-only fallback path if no image is provided
            const textToScan = payload?.text || "";
            const hits = scanTextContent(textToScan);
            const threatProfile = evaluateThreatProfile(hits);

            sendResponse({ 
              status: "success", 
              data: { 
                scanId: "scan_" + Date.now(), 
                hitsCount: hits.length,
                hits: hits.map(h => ({
                  type: h.type,
                  name: h.name,
                  index: h.index,
                  length: h.length,
                  severity: h.severity
                })),
                riskScore: threatProfile.riskScore,
                documentContext: threatProfile.documentContext,
                recommendation: threatProfile.recommendation
              } 
            });
          }
        } catch (err) {
          console.error("Scan processing error:", err);
          sendResponse({ status: "error", message: err.message });
        }
      })();
      break;

    case "PII_DETECTED":
      console.log("Handling PII_DETECTED alert:", payload);
      sendResponse({ 
        status: "success", 
        data: { 
          logged: true, 
          severity: "high", 
          detectedAt: new Date().toISOString() 
        } 
      });
      break;

    case "APPLY_REDACTION":
      console.log("Handling APPLY_REDACTION with payload:", payload);
      applyCanvasRedaction(payload?.imageSrc, payload?.boundingBoxes)
        .then(redactedImage => {
          sendResponse({ 
            status: "success", 
            data: { 
              redactedImage,
              boundingBoxesCount: payload?.boundingBoxes?.length || 0,
              message: "Redaction applied successfully using canvas obscuring engine." 
            } 
          });
        })
        .catch(err => {
          console.error("Redaction processing error:", err);
          sendResponse({ status: "error", message: err.message });
        });
      break;

    default:
      console.warn("Unhandled message action received:", action);
      sendResponse({ 
        status: "error", 
        message: `Unknown action: ${action}` 
      });
      break;
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});
