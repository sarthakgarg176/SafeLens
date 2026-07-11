(function(){"use strict";const w=new Set(["image/png","image/jpeg","image/jpg","image/webp","image/gif"]);function E(t,n,i,e){if(!t||t.length===0)return;const a=Array.from(t),s=[],o=[];for(const r of a)w.has(r.type)?(s.push(r),o.push({name:r.name,size:r.size,type:r.type,lastModified:r.lastModified})):console.log(`[UploadDetector] Ignoring unsupported file type: ${r.type} (${r.name})`);s.length>0?(console.log(`[UploadDetector] Detected ${s.length} image(s) for scanning:`,o),e.interceptUpload(s,o,n,i)):(console.log("[UploadDetector] No image files detected. Proceeding with standard file upload."),i(t))}function v(t){return t.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function S(t,n){return new Promise(i=>{if(document.getElementById("safelens-intercept-modal"))return i("cancel");const e=document.createElement("div");e.id="safelens-intercept-modal";const a=document.createElement("style");a.textContent=`
      #safelens-intercept-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 12, 16, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 2147483647;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
        color: #e2e8f0;
      }
      .sl-modal-card {
        width: 440px;
        background: linear-gradient(135deg, #131722 0%, #0c0e14 100%);
        border: 1px solid rgba(102, 252, 241, 0.25);
        border-radius: 20px;
        padding: 30px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(102, 252, 241, 0.05);
        display: flex;
        flex-direction: column;
        gap: 22px;
        animation: sl-scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes sl-scale-up {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      .sl-header {
        display: flex;
        align-items: center;
        gap: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 18px;
      }
      .sl-pulse-glow {
        width: 12px;
        height: 12px;
        background-color: #66fcf1;
        border-radius: 50%;
        box-shadow: 0 0 15px #66fcf1;
        animation: sl-pulse-anim 2s infinite;
      }
      @keyframes sl-pulse-anim {
        0% { transform: scale(0.9); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 25px #66fcf1; }
        100% { transform: scale(0.9); opacity: 0.8; }
      }
      .sl-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(90deg, #66fcf1 0%, #00d2ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .sl-badge {
        background: rgba(102, 252, 241, 0.12);
        border: 1px solid rgba(102, 252, 241, 0.4);
        color: #66fcf1;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 99px;
        margin-left: auto;
      }
      .sl-body {
        font-size: 14px;
        line-height: 1.6;
        color: #a0aec0;
      }
      .sl-body p {
        margin: 0 0 14px 0;
      }
      .sl-file-list {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 14px;
        max-height: 120px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .sl-file-item {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-family: 'Space Mono', monospace;
        color: #e2e8f0;
      }
      .sl-file-size {
        color: #718096;
      }
      .sl-footer {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
      }
      .sl-btn {
        padding: 13px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        text-align: center;
        border: 1px solid transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .sl-btn-protect {
        background: linear-gradient(90deg, #66fcf1 0%, #00b4db 100%);
        color: #0b0c10;
        box-shadow: 0 4px 15px rgba(102, 252, 241, 0.2);
      }
      .sl-btn-protect:hover {
        background: linear-gradient(90deg, #76fff5 0%, #00c6f0 100%);
        box-shadow: 0 6px 20px rgba(102, 252, 241, 0.35);
        transform: translateY(-1px);
      }
      .sl-btn-anyway {
        background: rgba(246, 173, 85, 0.06);
        border: 1px solid rgba(246, 173, 85, 0.4);
        color: #f6ad55;
      }
      .sl-btn-anyway:hover {
        background: rgba(246, 173, 85, 0.15);
        border-color: #f6ad55;
        transform: translateY(-1px);
      }
      .sl-btn-cancel {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #a0aec0;
      }
      .sl-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        transform: translateY(-1px);
      }
    `;const s=n.map(u=>{const z=u.name.length>30?u.name.substring(0,27)+"...":u.name;return`
        <div class="sl-file-item">
          <span>📄 ${v(z)}</span>
          <span class="sl-file-size">${(u.size/1024).toFixed(1)} KB</span>
        </div>
      `}).join("");e.innerHTML=`
      <div class="sl-modal-card">
        <div class="sl-header">
          <div class="sl-pulse-glow"></div>
          <h2 class="sl-title">SafeLens Shield</h2>
          <span class="sl-badge">Intercepted</span>
        </div>
        <div class="sl-body">
          <p>An outbound image upload was intercepted. Select your privacy protection level to proceed:</p>
          <div class="sl-file-list">
            ${s}
          </div>
        </div>
        <div class="sl-footer">
          <div id="sl-btn-protect" class="sl-btn sl-btn-protect">🛡️ Protect & Upload (Secure)</div>
          <div id="sl-btn-anyway" class="sl-btn sl-btn-anyway">⚠️ Upload Anyway (Unsecured)</div>
          <div id="sl-btn-cancel" class="sl-btn sl-btn-cancel">❌ Cancel Upload</div>
        </div>
      </div>
    `,e.appendChild(a),document.body.appendChild(e);const o=document.getElementById("sl-btn-protect"),r=document.getElementById("sl-btn-anyway"),l=document.getElementById("sl-btn-cancel"),f=u=>{P(),i(u)};o.addEventListener("click",()=>f("protect")),r.addEventListener("click",()=>f("anyway")),l.addEventListener("click",()=>f("cancel"));function P(){e.parentNode&&e.parentNode.removeChild(e)}})}async function k(t,n,i,e){console.log("[UploadInterceptor] Intercepting upload event for files:",n.map(a=>a.name));try{let a={protectionEnabled:!0,autoProtect:!1};if(typeof chrome<"u"&&chrome.storage&&chrome.storage.local){const o=await chrome.storage.local.get("settings");o.settings&&(a=o.settings)}if(a.protectionEnabled===!1)return console.log("[UploadInterceptor] Shield is suspended. Resuming original upload."),e(t);if(a.autoProtect===!0||a.autoRedact===!0){console.log("[UploadInterceptor] Auto Protect is ON. Running protection pipeline immediately...");const r=(await m(t,a)).map(l=>l.protectedFile);e(r)}else{const o=await S(t,n);if(o==="protect"){console.log("[UploadInterceptor] User selected: PROTECT. Executing pipeline...");const l=(await m(t,a)).map(f=>f.protectedFile);e(l)}else o==="anyway"?(console.log("[UploadInterceptor] User selected: UPLOAD ANYWAY. Re-triggering original files."),e(t)):console.log("[UploadInterceptor] User selected: CANCEL. Upload aborted.")}}catch(a){console.error("[UploadInterceptor] Interception pipeline failure:",a),e(t)}}async function m(t,n){const i=await Promise.all(t.map(async e=>{try{console.log("[UploadInterceptor] Serializing and delegating file to SW:",e.name);const a=await e.arrayBuffer(),s=await new Promise(o=>{chrome.runtime.sendMessage({type:"RUN_PROTECT_PIPELINE",payload:{arrayBuffer:a,name:e.name,type:e.type,settings:n}},r=>{chrome.runtime.lastError?(console.error("[UploadInterceptor] SW message error:",chrome.runtime.lastError.message),o({success:!1,error:chrome.runtime.lastError.message})):o(r||{success:!1,error:"No response from Service Worker"})})});if(s&&s.success&&s.data){const o=s.data,r=new Blob([o.arrayBuffer],{type:o.type}),l=new File([r],o.name,{type:o.type,lastModified:Date.now()});return{success:!0,originalFile:e,protectedFile:l,phash:o.phash,whash:o.whash,metadata:{name:e.name,size:e.size,type:e.type},detections:o.detections,risk:o.risk,protectionSummary:o.protectionSummary}}else throw new Error(s&&s.error||"Failed protection pipeline execution")}catch(a){return console.error("[UploadInterceptor] Pipeline delegation failed. Falling back to original:",e.name,a),{success:!1,originalFile:e,protectedFile:e,phash:"",whash:"",metadata:{name:e.name,size:e.size,type:e.type},detections:[],risk:"low",protectionSummary:{processingTime:0,redacted:!1},error:a.message}}}));return await Promise.all(i.map(async e=>{if(!e.success)return;let a=null;try{const s=new FormData;s.append("image",e.protectedFile),s.append("blur_enabled",n.blurMode==="blur"&&e.protectionSummary.redacted?"true":"false"),s.append("ai_cloak",n.aiCloakEnabled&&e.protectionSummary.redacted?"true":"false"),s.append("watermark",n.watermarkEnabled&&e.protectionSummary.redacted?"true":"false");const o=await fetch("http://localhost:8000/api/protect",{method:"POST",body:s});if(o.ok){const r=await o.json();r.success&&r.data&&(a=r.data.asset_id,console.log("[UploadInterceptor] Registered asset on backend. ID:",a))}}catch(s){console.warn("[UploadInterceptor] Backend asset registration bypassed (server offline):",s.message)}try{const s=e.detections.reduce((o,r)=>Math.max(o,r.fusedConfidence||0),0)||.8;await chrome.runtime.sendMessage({type:"LOG_SCAN",payload:{scanId:`scan_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,fileName:e.originalFile.name,size:e.originalFile.size,riskLevel:e.risk,confidence:parseFloat(s.toFixed(2)),piiCount:e.detections.length,processingTime:e.protectionSummary.processingTime,status:e.protectionSummary.redacted?"protected":"passed",detections:e.detections,assetId:a}})}catch(s){console.warn("[UploadInterceptor] Failed to log scan result:",s)}})),i}const I=Object.freeze(Object.defineProperty({__proto__:null,interceptUpload:k},Symbol.toStringTag,{value:"Module"}));let b=null;const d=new Map;function y(t){return t.isSafeLensTriggered===!0||t.detail&&t.detail.isSafeLensTriggered===!0}function g(t){return function(n){if(y(n))return;let i=null;const e=n.currentTarget||n.target;if(t==="change"&&n.target.files?i=n.target.files:t==="drop"&&n.dataTransfer?i=n.dataTransfer.files:t==="paste"&&n.clipboardData&&(i=n.clipboardData.files),!i||i.length===0)return;n.preventDefault(),n.stopImmediatePropagation(),E(i,e,s=>{console.log(`[DOMObserver] Re-injecting and triggering event: ${t}`,{fileCount:s.length});const o=new DataTransfer;if(Array.from(s).forEach(r=>o.items.add(r)),t==="change"){e.files=o.files;const r=new Event("change",{bubbles:!0,cancelable:!0});r.isSafeLensTriggered=!0,e.dispatchEvent(r)}else if(t==="drop"){const r=new DragEvent("drop",{bubbles:!0,cancelable:!0,dataTransfer:o});r.isSafeLensTriggered=!0,e.dispatchEvent(r)}else if(t==="paste"){const r=new ClipboardEvent("paste",{bubbles:!0,cancelable:!0,clipboardData:o});r.isSafeLensTriggered=!0,e.dispatchEvent(r)}},I)}}const p={change:g("change"),drop:g("drop"),paste:g("paste")};function h(t){y(t)||t.preventDefault()}function c(t,n,i){if(d.size>200)for(const a of d.keys())a.isConnected||d.delete(a);d.has(t)||d.set(t,{});const e=d.get(t);e[n]||(t.addEventListener(n,i,!0),e[n]=i)}function x(t){if(!t||typeof t.querySelectorAll!="function")return;t.querySelectorAll('input[type="file"]').forEach(a=>{c(a,"change",p.change)}),t.querySelectorAll('[class*="drop"], [class*="upload"], [id*="drop"], [id*="upload"], [role="button"]').forEach(a=>{c(a,"dragover",h),c(a,"drop",p.drop)}),t.querySelectorAll('textarea, [contenteditable="true"]').forEach(a=>{c(a,"paste",p.paste)})}function U(){console.log("[DOMObserver] Initializing DOM Observer..."),x(document),document.body&&(b=new MutationObserver(t=>{for(const n of t)n.type==="childList"&&n.addedNodes.forEach(i=>{i.nodeType===Node.ELEMENT_NODE&&x(i)})}),b.observe(document.body,{childList:!0,subtree:!0})),c(document,"change",p.change),c(document,"dragover",h),c(document,"drop",p.drop),c(document,"paste",p.paste)}console.log("[SafeLens] Content Script successfully injected.");try{U()}catch(t){console.error("[SafeLens] Failed to initialize content observers:",t)}})();
