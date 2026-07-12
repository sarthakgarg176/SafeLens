(function(){"use strict";const v=new Set(["image/png","image/jpeg","image/jpg","image/webp","image/gif"]);function I(t,n,s,e){if(!t||t.length===0)return;const r=Array.from(t),c=[],o=[];for(const a of r)v.has(a.type)?(c.push(a),o.push({name:a.name,size:a.size,type:a.type,lastModified:a.lastModified})):console.log(`[UploadDetector] Ignoring unsupported file type: ${a.type} (${a.name})`);c.length>0?(console.log(`[UploadDetector] Detected ${c.length} image(s) for scanning:`,o),e.interceptUpload(c,o,n,s)):(console.log("[UploadDetector] No image files detected. Proceeding with standard file upload."),s(t))}function S(t){return t.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function k(t,n){return new Promise(s=>{if(document.getElementById("safelens-intercept-modal"))return s("cancel");const e=document.createElement("div");e.id="safelens-intercept-modal";const r=document.createElement("style");r.textContent=`
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
    `;const c=n.map(g=>{const b=g.name.length>30?g.name.substring(0,27)+"...":g.name;return`
        <div class="sl-file-item">
          <span>📄 ${S(b)}</span>
          <span class="sl-file-size">${(g.size/1024).toFixed(1)} KB</span>
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
            ${c}
          </div>
        </div>
        <div class="sl-footer">
          <div id="sl-btn-protect" class="sl-btn sl-btn-protect">🛡️ Protect & Upload (Secure)</div>
          <div id="sl-btn-anyway" class="sl-btn sl-btn-anyway">⚠️ Upload Anyway (Unsecured)</div>
          <div id="sl-btn-cancel" class="sl-btn sl-btn-cancel">❌ Cancel Upload</div>
        </div>
      </div>
    `,e.appendChild(r),document.body.appendChild(e);const o=document.getElementById("sl-btn-protect"),a=document.getElementById("sl-btn-anyway"),l=document.getElementById("sl-btn-cancel"),i=g=>{d(),s(g)};o.addEventListener("click",()=>i("protect")),a.addEventListener("click",()=>i("anyway")),l.addEventListener("click",()=>i("cancel"));function d(){e.parentNode&&e.parentNode.removeChild(e)}})}async function P(t,n,s,e){console.log("[UploadInterceptor] Intercepting upload event for files:",n.map(r=>r.name));try{let r={protectionEnabled:!0,autoProtect:!1};if(typeof chrome<"u"&&chrome.storage&&chrome.storage.local){const o=await chrome.storage.local.get("settings");o.settings&&(r=o.settings)}if(r.protectionEnabled===!1)return console.log("[UploadInterceptor] Shield is suspended. Resuming original upload."),e(t);if(r.autoProtect===!0||r.autoRedact===!0){console.log("[UploadInterceptor] Auto Protect is ON. Running protection pipeline immediately...");const a=(await h(t,r)).map(l=>l.protectedFile);e(a)}else{const o=await k(t,n);if(o==="protect"){console.log("[UploadInterceptor] User selected: PROTECT. Executing pipeline...");const l=(await h(t,r)).map(i=>i.protectedFile);e(l)}else o==="anyway"?(console.log("[UploadInterceptor] User selected: UPLOAD ANYWAY. Re-triggering original files."),e(t)):console.log("[UploadInterceptor] User selected: CANCEL. Upload aborted.")}}catch(r){console.error("[UploadInterceptor] Interception pipeline failure:",r),e(t)}}async function h(t,n){const s=await Promise.all(t.map(async e=>{var r,c;try{console.log("[UploadInterceptor] Serializing and delegating file to SW:",e.name);const o=await e.arrayBuffer();console.log("===================================="),console.log("A: Before PING"),console.log("chrome =",chrome),console.log("chrome.runtime =",chrome==null?void 0:chrome.runtime),console.log("typeof sendMessage =",typeof((r=chrome==null?void 0:chrome.runtime)==null?void 0:r.sendMessage)),console.log("===================================="),console.log("[UploadInterceptor] Sending PING to wake Service Worker..."),await new Promise(i=>{chrome.runtime.sendMessage({type:"PING"},d=>{chrome.runtime.lastError?console.warn("[UploadInterceptor] PING failed or no response:",chrome.runtime.lastError.message):console.log("[UploadInterceptor] PING response received. SW is awake."),i(d)})}),console.log("[UploadInterceptor] PING complete. typeof chrome.storage.session:",typeof chrome.storage.session);const a="pending_image_"+Date.now()+"_"+Math.random().toString(36).substr(2,9);await chrome.storage.session.set({[a]:o}),console.log("===================================="),console.log("B: Before RUN_PROTECT_PIPELINE"),console.log("chrome =",chrome),console.log("chrome.runtime =",chrome==null?void 0:chrome.runtime),console.log("typeof sendMessage =",typeof((c=chrome==null?void 0:chrome.runtime)==null?void 0:c.sendMessage)),console.log("====================================");const l=await new Promise(i=>{chrome.runtime.sendMessage({type:"RUN_PROTECT_PIPELINE",payload:{storageKey:a,name:e.name,type:e.type,settings:n}},d=>{chrome.runtime.lastError?(console.error("[UploadInterceptor] SW message error:",chrome.runtime.lastError.message),i({success:!1,error:chrome.runtime.lastError.message})):i(d||{success:!1,error:"No response from Service Worker"})})});if(l&&l.success&&l.data){const i=l.data;let d;i.storageKey?(d=(await chrome.storage.session.get(i.storageKey))[i.storageKey],await chrome.storage.session.remove(i.storageKey)):d=i.arrayBuffer||o;const g=new Blob([d],{type:i.type}),b=new File([g],i.name,{type:i.type,lastModified:Date.now()});return{success:!0,originalFile:e,protectedFile:b,phash:i.phash,whash:i.whash,metadata:{name:e.name,size:e.size,type:e.type},detections:i.detections,risk:i.risk,protectionSummary:i.protectionSummary}}else throw new Error(l&&l.error||"Failed protection pipeline execution")}catch(o){return console.error("[UploadInterceptor] Pipeline delegation failed. Falling back to original:",e.name,o),{success:!1,originalFile:e,protectedFile:e,phash:"",whash:"",metadata:{name:e.name,size:e.size,type:e.type},detections:[],risk:"low",protectionSummary:{processingTime:0,redacted:!1},error:o.message}}}));return await Promise.all(s.map(async e=>{var c;if(!e.success)return;let r=null;try{const o=new FormData;o.append("image",e.protectedFile),o.append("blur_enabled",n.blurMode==="blur"&&e.protectionSummary.redacted?"true":"false"),o.append("ai_cloak",n.aiCloakEnabled&&e.protectionSummary.redacted?"true":"false"),o.append("watermark",n.watermarkEnabled&&e.protectionSummary.redacted?"true":"false");const a=await fetch("http://localhost:8000/api/protect",{method:"POST",body:o});if(a.ok){const l=await a.json();l.success&&l.data&&(r=l.data.asset_id,console.log("[UploadInterceptor] Registered asset on backend. ID:",r))}}catch(o){console.warn("[UploadInterceptor] Backend asset registration bypassed (server offline):",o.message)}console.log("===================================="),console.log("C: Before LOG_SCAN"),console.log("chrome =",chrome),console.log("chrome.runtime =",chrome==null?void 0:chrome.runtime),console.log("typeof sendMessage =",typeof((c=chrome==null?void 0:chrome.runtime)==null?void 0:c.sendMessage)),console.log("====================================");try{const o=e.detections.reduce((a,l)=>Math.max(a,l.fusedConfidence||0),0)||.8;await chrome.runtime.sendMessage({type:"LOG_SCAN",payload:{scanId:`scan_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,fileName:e.originalFile.name,size:e.originalFile.size,riskLevel:e.risk,confidence:parseFloat(o.toFixed(2)),piiCount:e.detections.length,processingTime:e.protectionSummary.processingTime,status:e.protectionSummary.redacted?"protected":"passed",detections:e.detections,assetId:r}})}catch(o){console.warn("[UploadInterceptor] Failed to log scan result:",o)}})),s}const U=Object.freeze(Object.defineProperty({__proto__:null,interceptUpload:P},Symbol.toStringTag,{value:"Module"}));let y=null;const u=new Map;function w(t){return t.isSafeLensTriggered===!0||t.detail&&t.detail.isSafeLensTriggered===!0}function m(t){return function(n){if(w(n))return;let s=null;const e=n.target;if(t==="change"&&n.target.files?s=n.target.files:t==="drop"&&n.dataTransfer?s=n.dataTransfer.files:t==="paste"&&n.clipboardData&&(s=n.clipboardData.files),!s||s.length===0)return;n.preventDefault(),n.stopImmediatePropagation(),I(s,e,c=>{console.log(`[DOMObserver] Re-injecting and triggering event: ${t} on targetElement: ${e?e.constructor.name:"null"}`,{fileCount:c.length});const o=new DataTransfer;if(Array.from(c).forEach(a=>o.items.add(a)),t==="change"){e instanceof HTMLInputElement&&(e.files=o.files);const a=new Event("change",{bubbles:!0,cancelable:!0});a.isSafeLensTriggered=!0,e.dispatchEvent(a)}else if(t==="drop"){const a=new DragEvent("drop",{bubbles:!0,cancelable:!0,dataTransfer:o});a.isSafeLensTriggered=!0,e.dispatchEvent(a)}else if(t==="paste"){const a=new ClipboardEvent("paste",{bubbles:!0,cancelable:!0,clipboardData:o});a.isSafeLensTriggered=!0,e.dispatchEvent(a)}},U)}}const f={change:m("change"),drop:m("drop"),paste:m("paste")};function x(t){w(t)||t.preventDefault()}function p(t,n,s){if(u.size>200)for(const r of u.keys())r.isConnected||u.delete(r);u.has(t)||u.set(t,{});const e=u.get(t);e[n]||(t.addEventListener(n,s,!0),e[n]=s)}function E(t){if(!t||typeof t.querySelectorAll!="function")return;t.querySelectorAll('input[type="file"]').forEach(r=>{p(r,"change",f.change)}),t.querySelectorAll('[class*="drop"], [class*="upload"], [id*="drop"], [id*="upload"], [role="button"]').forEach(r=>{p(r,"dragover",x),p(r,"drop",f.drop)}),t.querySelectorAll('textarea, [contenteditable="true"]').forEach(r=>{p(r,"paste",f.paste)})}function M(){console.log("[DOMObserver] Initializing DOM Observer..."),E(document),document.body&&(y=new MutationObserver(t=>{for(const n of t)n.type==="childList"&&n.addedNodes.forEach(s=>{s.nodeType===Node.ELEMENT_NODE&&E(s)})}),y.observe(document.body,{childList:!0,subtree:!0})),p(document,"change",f.change),p(document,"dragover",x),p(document,"drop",f.drop),p(document,"paste",f.paste)}console.log("[SafeLens] Content Script successfully injected.");try{M()}catch(t){console.error("[SafeLens] Failed to initialize content observers:",t)}})();
