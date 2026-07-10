(function(){"use strict";const h=new Set(["image/png","image/jpeg","image/jpg","image/webp","image/gif"]);function y(e,t,n,o){if(!e||e.length===0)return;const a=Array.from(e),s=[],i=[];for(const r of a)h.has(r.type)?(s.push(r),i.push({name:r.name,size:r.size,type:r.type,lastModified:r.lastModified})):console.log(`[UploadDetector] Ignoring unsupported file type: ${r.type} (${r.name})`);s.length>0?(console.log(`[UploadDetector] Detected ${s.length} image(s) for scanning:`,i),o.interceptUpload(s,i,t,n)):(console.log("[UploadDetector] No image files detected. Proceeding with standard file upload."),n(e))}window.__SafeLensProtectPipeline=null;function x(e,t,n,o){console.log("[UploadInterceptor] Intercepted upload request",{fileCount:e.length,targetElement:n}),typeof window.__SafeLensProtectPipeline=="function"?window.__SafeLensProtectPipeline(e).then(({action:a,processedFiles:s})=>{p(a,s||e,o)}).catch(a=>{console.error("[UploadInterceptor] Custom protect pipeline failed:",a),f(e,t,o)}):f(e,t,o)}function p(e,t,n){switch(e){case"protect":console.log("[UploadInterceptor] User selected: PROTECT. Simulating AI pipeline..."),w(t).then(o=>{n(o)});break;case"anyway":console.log("[UploadInterceptor] User selected: UPLOAD ANYWAY. Re-triggering original files."),n(t);break;case"cancel":default:console.log("[UploadInterceptor] User selected: CANCEL. Upload terminated.");break}}async function w(e){return new Promise(t=>{setTimeout(()=>{const n=e.map(o=>new File([o],o.name.replace(/(\.[\w\d]+)$/,"_protected$1"),{type:o.type,lastModified:Date.now()}));console.log("[UploadInterceptor] Protection complete. Simulated redacted files:",n),t(n)},1200)})}function v(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function f(e,t,n){if(document.getElementById("safelens-intercept-modal"))return;const o=document.createElement("div");o.id="safelens-intercept-modal";const a=document.createElement("style");a.textContent=`
    #safelens-intercept-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 12, 16, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 2147483647;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
      color: #c5c6c7;
    }
    .sl-modal-card {
      width: 420px;
      background: linear-gradient(135deg, #121824 0%, #0b0c10 100%);
      border: 1px solid #2f3e46;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: sl-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes sl-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .sl-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #2f3e46;
      padding-bottom: 16px;
    }
    .sl-pulse {
      width: 10px;
      height: 10px;
      background-color: #66fcf1;
      border-radius: 50%;
      box-shadow: 0 0 10px #66fcf1;
    }
    .sl-title {
      font-size: 20px;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(90deg, #66fcf1 0%, #4facfe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sl-badge {
      background: rgba(102, 252, 241, 0.1);
      border: 1px solid #66fcf1;
      color: #66fcf1;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      margin-left: auto;
    }
    .sl-body {
      font-size: 13px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sl-file-list {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid #2f3e46;
      border-radius: 8px;
      padding: 12px;
      max-height: 100px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .sl-file-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: monospace;
    }
    .sl-file-size {
      color: #718096;
    }
    .sl-footer {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .sl-btn {
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      border: 1px solid transparent;
    }
    .sl-btn-protect {
      background: #66fcf1;
      color: #0b0c10;
    }
    .sl-btn-protect:hover {
      box-shadow: 0 0 15px rgba(102, 252, 241, 0.4);
      background: #76fff5;
    }
    .sl-btn-anyway {
      background: rgba(246, 173, 85, 0.1);
      border: 1px solid #f6ad55;
      color: #f6ad55;
    }
    .sl-btn-anyway:hover {
      background: rgba(246, 173, 85, 0.2);
    }
    .sl-btn-cancel {
      background: rgba(113, 128, 150, 0.1);
      border: 1px solid #718096;
      color: #cbd5e0;
    }
    .sl-btn-cancel:hover {
      background: rgba(113, 128, 150, 0.2);
    }
  `;const s=t.map(r=>{const k=r.name.length>28?r.name.substring(0,25)+"...":r.name;return`
      <div class="sl-file-item">
        <span>📄 ${v(k)}</span>
        <span class="sl-file-size">${(r.size/1024).toFixed(1)} KB</span>
      </div>
    `}).join("");o.innerHTML=`
    <div class="sl-modal-card">
      <div class="sl-header">
        <div class="sl-pulse"></div>
        <h2 class="sl-title">SafeLens Shield</h2>
        <span class="sl-badge">Intercepted</span>
      </div>
      <div class="sl-body">
        <p>SafeLens intercepted a file upload request. Choose how you want to proceed to secure your privacy:</p>
        <div class="sl-file-list">
          ${s}
        </div>
      </div>
      <div class="sl-footer">
        <div id="sl-btn-protect" class="sl-btn sl-btn-protect">🛡️ Protect (Redact & Upload)</div>
        <div id="sl-btn-anyway" class="sl-btn sl-btn-anyway">⚠️ Upload Anyway (Unprotected)</div>
        <div id="sl-btn-cancel" class="sl-btn sl-btn-cancel">❌ Cancel Upload</div>
      </div>
    </div>
  `,o.appendChild(a),document.body.appendChild(o),document.getElementById("sl-btn-protect").addEventListener("click",()=>{i(),p("protect",e,n)}),document.getElementById("sl-btn-anyway").addEventListener("click",()=>{i(),p("anyway",e,n)}),document.getElementById("sl-btn-cancel").addEventListener("click",()=>{i(),p("cancel",e,n)});function i(){o.parentNode&&o.parentNode.removeChild(o)}}const E=Object.freeze(Object.defineProperty({__proto__:null,interceptUpload:x},Symbol.toStringTag,{value:"Module"}));let u=null;const c=new Map;function g(e){return e.isSafeLensTriggered===!0||e.detail&&e.detail.isSafeLensTriggered===!0}function d(e){return function(t){if(g(t))return;let n=null;const o=t.currentTarget||t.target;if(e==="change"&&t.target.files?n=t.target.files:e==="drop"&&t.dataTransfer?n=t.dataTransfer.files:e==="paste"&&t.clipboardData&&(n=t.clipboardData.files),!n||n.length===0)return;t.preventDefault(),t.stopImmediatePropagation(),y(n,o,s=>{console.log(`[DOMObserver] Re-injecting and triggering event: ${e}`,{fileCount:s.length});const i=new DataTransfer;if(Array.from(s).forEach(r=>i.items.add(r)),e==="change"){o.files=i.files;const r=new Event("change",{bubbles:!0,cancelable:!0});r.isSafeLensTriggered=!0,o.dispatchEvent(r)}else if(e==="drop"){const r=new DragEvent("drop",{bubbles:!0,cancelable:!0,dataTransfer:i});r.isSafeLensTriggered=!0,o.dispatchEvent(r)}else if(e==="paste"){const r=new ClipboardEvent("paste",{bubbles:!0,cancelable:!0,clipboardData:i});r.isSafeLensTriggered=!0,o.dispatchEvent(r)}},E)}}function b(e){g(e)||e.preventDefault()}function l(e,t,n){if(c.size>200)for(const a of c.keys())a.isConnected||c.delete(a);c.has(e)||c.set(e,{});const o=c.get(e);o[t]||(e.addEventListener(t,n,!0),o[t]=n)}function m(e){if(!e||typeof e.querySelectorAll!="function")return;e.querySelectorAll('input[type="file"]').forEach(a=>{l(a,"change",d("change"))}),e.querySelectorAll('[class*="drop"], [class*="upload"], [id*="drop"], [id*="upload"], [role="button"]').forEach(a=>{l(a,"dragover",b),l(a,"drop",d("drop"))}),e.querySelectorAll('textarea, [contenteditable="true"]').forEach(a=>{l(a,"paste",d("paste"))})}function S(){console.log("[DOMObserver] Initializing DOM Observer..."),m(document),document.body&&(u=new MutationObserver(e=>{for(const t of e)t.type==="childList"&&t.addedNodes.forEach(n=>{n.nodeType===Node.ELEMENT_NODE&&m(n)})}),u.observe(document.body,{childList:!0,subtree:!0})),l(document,"change",d("change")),l(document,"dragover",b),l(document,"drop",d("drop")),l(document,"paste",d("paste"))}console.log("[SafeLens] Content Script successfully injected.");try{S()}catch(e){console.error("[SafeLens] Failed to initialize content observers:",e)}})();
