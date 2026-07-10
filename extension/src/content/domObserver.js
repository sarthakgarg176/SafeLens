import { detectAndProcessFiles } from './uploadDetector.js';
import * as uploadInterceptor from './uploadInterceptor.js';

/**
 * DOM Observer for SafeLens Content Script
 * 
 * Responsibility:
 * - Scans the DOM for static upload inputs, dropzones, and pasteable elements.
 * - Sets up a MutationObserver to dynamically detect new upload controls.
 * - Manages event listener bindings, ensuring listeners are registered exactly once.
 * - Formulates re-trigger callbacks for approved/redacted uploads.
 * - Cleans up all observers and listeners on teardown.
 */

// Mutation observer reference
let mutationObserver = null;

// Registry to track registered elements and their listener cleanups
const activeBindings = new Map(); // Element -> { eventType: listener }

/**
 * Checks if the event was programmatically dispatched by SafeLens.
 * 
 * @param {Event} event - Event object
 * @returns {boolean} True if dispatched by SafeLens
 */
function isSafeLensEvent(event) {
  return event.isSafeLensTriggered === true || (event.detail && event.detail.isSafeLensTriggered === true);
}

/**
 * Generic event interceptor callback generator.
 * 
 * @param {string} type - Event type: 'change', 'drop', 'paste'
 * @returns {function(Event): void} Event handler function
 */
function createInterceptor(type) {
  return function (event) {
    // 1. Bypass check if event was triggered programmatically by SafeLens
    if (isSafeLensEvent(event)) {
      return;
    }

    let files = null;
    const targetElement = event.currentTarget || event.target;

    // 2. Extract file assets based on event type
    if (type === 'change' && event.target.files) {
      files = event.target.files;
    } else if (type === 'drop' && event.dataTransfer) {
      files = event.dataTransfer.files;
    } else if (type === 'paste' && event.clipboardData) {
      files = event.clipboardData.files;
    }

    if (!files || files.length === 0) {
      return;
    }

    // 3. Stop propagation and prevent page default execution
    event.preventDefault();
    event.stopImmediatePropagation();

    // 4. Formulate the re-trigger callback to execute after scan approval
    const onApprovalCallback = (approvedFiles) => {
      console.log(`[DOMObserver] Re-injecting and triggering event: ${type}`, { fileCount: approvedFiles.length });
      
      const dataTransfer = new DataTransfer();
      Array.from(approvedFiles).forEach((file) => dataTransfer.items.add(file));

      if (type === 'change') {
        // Assign files to input
        targetElement.files = dataTransfer.files;

        // Dispatch cloned change event
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        changeEvent.isSafeLensTriggered = true;
        targetElement.dispatchEvent(changeEvent);

      } else if (type === 'drop') {
        // Create and dispatch simulated DragEvent
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dataTransfer
        });
        dropEvent.isSafeLensTriggered = true;
        targetElement.dispatchEvent(dropEvent);

      } else if (type === 'paste') {
        // Create and dispatch simulated ClipboardEvent
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer
        });
        pasteEvent.isSafeLensTriggered = true;
        targetElement.dispatchEvent(pasteEvent);
      }
    };

    // 5. Delegate processing to the Upload Detector
    detectAndProcessFiles(files, targetElement, onApprovalCallback, uploadInterceptor);
  };
}

/**
 * Safe dragover interceptor to allow drop events.
 */
function handleDragOver(event) {
  if (isSafeLensEvent(event)) {
    return;
  }
  event.preventDefault(); // Necessary to allow dropping
}

/**
 * Bind listeners to an element if not already registered.
 * 
 * @param {HTMLElement} element - Target DOM element
 * @param {string} eventType - 'change', 'drop', 'paste', 'dragover'
 * @param {Function} listener - Handler function
 */
function bindListener(element, eventType, listener) {
  // Periodically clean up stale bindings to prevent memory leaks from deleted elements
  if (activeBindings.size > 200) {
    for (const activeElement of activeBindings.keys()) {
      if (!activeElement.isConnected) {
        activeBindings.delete(activeElement);
      }
    }
  }

  if (!activeBindings.has(element)) {
    activeBindings.set(element, {});
  }

  const elementBindings = activeBindings.get(element);
  if (elementBindings[eventType]) {
    return; // Already registered
  }

  // Bind capturing listener
  element.addEventListener(eventType, listener, true);
  elementBindings[eventType] = listener;
}

/**
 * Scans an element (and its children) to bind interception hooks.
 * 
 * @param {HTMLElement|Document} root - Node to scan
 */
function scanAndBind(root) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return;
  }

  // 1. Scan and bind file inputs
  const inputs = root.querySelectorAll('input[type="file"]');
  inputs.forEach((input) => {
    bindListener(input, 'change', createInterceptor('change'));
  });

  // 2. Scan and bind dropzones (common containers and role buttons)
  const dropzones = root.querySelectorAll('[class*="drop"], [class*="upload"], [id*="drop"], [id*="upload"], [role="button"]');
  dropzones.forEach((dz) => {
    bindListener(dz, 'dragover', handleDragOver);
    bindListener(dz, 'drop', createInterceptor('drop'));
  });

  // 3. Scan and bind editable areas (textareas, contenteditables)
  const editables = root.querySelectorAll('textarea, [contenteditable="true"]');
  editables.forEach((ed) => {
    bindListener(ed, 'paste', createInterceptor('paste'));
  });
}

/**
 * Initializes observers on the page.
 */
export function initialize() {
  console.log('[DOMObserver] Initializing DOM Observer...');

  // 1. Scan initial page state
  scanAndBind(document);

  // 2. Monitor page body for changes
  if (document.body) {
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              scanAndBind(node);
            }
          });
        }
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 3. Register global fallbacks on document to cover dynamic attachments not matched by queries
  bindListener(document, 'change', createInterceptor('change'));
  bindListener(document, 'dragover', handleDragOver);
  bindListener(document, 'drop', createInterceptor('drop'));
  bindListener(document, 'paste', createInterceptor('paste'));
}

/**
 * Disconnects the MutationObserver and removes all registered event listeners.
 */
export function disconnect() {
  console.log('[DOMObserver] Disconnecting and tearing down listeners...');

  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  // Unbind all registered element listeners
  for (const [element, bindings] of activeBindings.entries()) {
    try {
      Object.entries(bindings).forEach(([eventType, listener]) => {
        element.removeEventListener(eventType, listener, true);
      });
    } catch (e) {
      console.warn('[DOMObserver] Error unbinding element listener:', e);
    }
  }

  activeBindings.clear();
}
