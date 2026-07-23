// extension/src/content/contentScript.js
(function(){
  "use strict";
  const E = new Set(["image/png","image/jpeg","image/jpg","image/webp","image/gif"]);

  console.log("[SafeLens Master] Content Script successfully injected into target document context.");

  /* ── Master Token Interception Bridge (Embedded Phase 2 Fix) ────────────── */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    const data = event.data || {};
    if (data && data.type === 'SAFELENS_AUTH_INIT' && data.token) {
      console.log('[SafeLens Master Bridge] Token intercepted directly in ContentScript:', data.token);
      
      try {
        if (chrome.runtime && chrome.runtime.id) {
          // Wrap token inside payload object to match exact messageRouter signatures
          chrome.runtime.sendMessage({ 
            type: 'AUTH_HANDSHAKE', 
            payload: { token: data.token } 
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[SafeLens Master Bridge] Background connection handshake dropped:', chrome.runtime.lastError.message);
            } else {
              console.log('[SafeLens Master Bridge] Explicit ACK from background router received:', response);
            }
          });
        }
      } catch (err) {
        console.error('[SafeLens Master Bridge] Runtime messaging environment error:', err);
      }
    }
  });

  // Relay broadcast messages from background script to the window
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'SAFELENS_BROADCAST_SCAN_COMPLETED') {
        window.postMessage({ type: 'SAFELENS_SCAN_COMPLETED' }, '*');
      }
    });
  }

  function arrayBufferToBase64(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    if (!base64) return new ArrayBuffer(0);
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function S(a,o,s,e){
    if(!a||a.length===0)return;
    const r=Array.from(a),i=[],n=[];
    for(const t of r)E.has(t.type)?(i.push(t),n.push({name:t.name,size:t.size,type:t.type,lastModified:t.lastModified})):console.log(`[UploadDetector] Ignoring unsupported file type: ${t.type} (${t.name})`);
    i.length>0?(console.log(`[UploadDetector] Detected ${i.length} image(s) for scanning:`,n),e.interceptUpload(i,n,o,s)):(console.log("[UploadDetector] No image files detected. Proceeding with standard file upload."),s(a))
  }

  function v(a){
    return a.replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])
  }

  function I(a,o){
    return new Promise(s=>{
      if(document.getElementById("safelens-intercept-modal"))return s("cancel");
      const e=document.createElement("div");
      e.id="safelens-intercept-modal";
      const r=document.createElement("style");
      r.textContent=`
        #safelens-intercept-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10, 12, 16, 0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 2147483647; display: flex; justify-content: center; align-items: center; font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif; color: #e2e8f0; }
        .sl-modal-card { width: 440px; background: linear-gradient(135deg, #131722 0%, #0c0e14 100%); border: 1px solid rgba(102, 252, 241, 0.25); border-radius: 20px; padding: 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(102, 252, 241, 0.05); display: flex; flex-direction: column; gap: 22px; animation: sl-scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes sl-scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .sl-header { display: flex; align-items: center; gap: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 18px; }
        .sl-pulse-glow { width: 12px; height: 12px; background-color: #66fcf1; border-radius: 50%; box-shadow: 0 0 15px #66fcf1; animation: sl-pulse-anim 2s infinite; }
        @keyframes sl-pulse-anim { 0% { transform: scale(0.9); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 25px #66fcf1; } 100% { transform: scale(0.9); opacity: 0.8; } }
        .sl-title { font-size: 22px; font-weight: 800; margin: 0; background: linear-gradient(90deg, #66fcf1 0%, #00d2ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sl-badge { background: rgba(102, 252, 241, 0.12); border: 1px solid rgba(102, 252, 241, 0.4); color: #66fcf1; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-left: auto; }
        .sl-body { font-size: 14px; line-height: 1.6; color: #a0aec0; }
        .sl-body p { margin: 0 0 14px 0; }
        .sl-file-list { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .sl-file-item { display: flex; justify-content: space-between; font-size: 12px; font-family: 'Space Mono', monospace; color: #e2e8f0; }
        .sl-file-size { color: #718096; }
        .sl-footer { display: flex; flex-direction: column; gap: 12px; margin-top: 6px; }
        .sl-btn { padding: 13px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s ease-in-out; text-align: center; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .sl-btn-protect { background: linear-gradient(90deg, #66fcf1 0%, #00b4db 100%); color: #0b0c10; box-shadow: 0 4px 15px rgba(102, 252, 241, 0.2); }
        .sl-btn-protect:hover { background: linear-gradient(90deg, #76fff5 0%, #00c6f0 100%); box-shadow: 0 6px 20px rgba(102, 252, 241, 0.35); transform: translateY(-1px); }
        .sl-btn-anyway { background: rgba(246, 173, 85, 0.06); border: 1px solid rgba(246, 173, 85, 0.4); color: #f6ad55; }
        .sl-btn-anyway:hover { background: rgba(246, 173, 85, 0.15); border-color: #f6ad55; transform: translateY(-1px); }
        .sl-btn-cancel { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.15); color: #a0aec0; }
        .sl-btn-cancel:hover { background: rgba(255, 255, 255, 0.08); color: #fff; transform: translateY(-1px); }
      `;
      const i=o.map(p=>{
        const D=p.name.length>30?p.name.substring(0,27)+"...":p.name;
        return `<div class="sl-file-item"><span>📄 ${v(D)}</span><span class="sl-file-size">${(p.size/1024).toFixed(1)} KB</span></div>`
      }).join("");
      e.innerHTML=`
        <div class="sl-modal-card">
          <div class="sl-header"><div class="sl-pulse-glow"></div><h2 class="sl-title">SafeLens Shield</h2><span class="sl-badge">Intercepted</span></div>
          <div class="sl-body"><p>An outbound image upload was intercepted. Select your privacy protection level to proceed:</p><div class="sl-file-list">${i}</div></div>
          <div class="sl-footer">
            <div id="sl-btn-protect" class="sl-btn sl-btn-protect">🛡️ Protect & Upload (Secure)</div>
            <div id="sl-btn-anyway" class="sl-btn sl-btn-anyway">⚠️ Upload Anyway (Unsecured)</div>
            <div id="sl-btn-cancel" class="sl-btn sl-btn-cancel">❌ Cancel Upload</div>
          </div>
        </div>
      `,e.appendChild(r),document.body.appendChild(e);
      const n=document.getElementById("sl-btn-protect"),t=document.getElementById("sl-btn-anyway"),c=document.getElementById("sl-btn-cancel"),l=p=>{m(),s(p)};
      n.addEventListener("click",()=>l("protect")),t.addEventListener("click",()=>l("anyway")),c.addEventListener("click",()=>l("cancel"));
      function m(){e.parentNode&&e.parentNode.removeChild(e)}
    })
  }

  async function k(a,o,s,e){
    console.log("[UploadInterceptor] Intercepting upload event for files:",o.map(r=>r.name));
    try{
      let r={protectionEnabled:!0,autoProtect:!1};
      try {
        const response = await new Promise(resolve => chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, resolve));
        if (response && response.success && response.data) r = response.data;
        else if (response && response.settings) r = response.settings;
      } catch (err) {
        console.warn("[UploadInterceptor] Could not fetch settings, using defaults.", err);
      }
      if(r.protectionEnabled===!1)return console.log("[UploadInterceptor] Shield is suspended. Resuming original upload."),e(a);
      if(r.autoProtect===!0||r.autoRedact===!0){
        console.log("[UploadInterceptor] Auto Protect is ON. Running protection pipeline immediately...");
        const t=(await b(a,r)).map(c=>c.protectedFile);
        e(t)
      }else{
        const n=await I(a,o);
        if(n==="protect"){
          console.log("[UploadInterceptor] User selected: PROTECT. Executing pipeline...");
          const c=(await b(a,r)).map(l=>l.protectedFile);
          e(c)
        }else n==="anyway"?(console.log("[UploadInterceptor] User selected: UPLOAD ANYWAY. Re-triggering original files."),e(a)):console.log("[UploadInterceptor] User selected: CANCEL. Upload aborted.")
      }
    }catch(r){console.error("[UploadInterceptor] Interception pipeline failure:",r),e(a)}
  }

  async function b(a,o){
    const s=await Promise.all(a.map(async e=>{
      try{
        console.log("[UploadInterceptor] Serializing and delegating file to SW:",e.name);
        const r=await e.arrayBuffer();
        
        if(typeof chrome==="undefined"||!chrome?.runtime?.sendMessage){
          console.warn("[UploadInterceptor] Extension runtime context isolated. Bypassing worker communication.");
          throw new Error("Context isolated from extension APIs");
        }

        console.log("[UploadInterceptor] Sending PING to wake Service Worker..."),await new Promise(t=>{
          chrome.runtime.sendMessage({type:"PING"},c=>{chrome.runtime.lastError?console.warn("[UploadInterceptor] PING failed or no response:",chrome.runtime.lastError.message):console.log("[UploadInterceptor] PING response received. SW is awake."),t(c)})
        });
        const base64Data = arrayBufferToBase64(r);
        const n=await new Promise(t=>{
          chrome.runtime.sendMessage({type:"RUN_PROTECT_PIPELINE",payload:{base64Data:base64Data,name:e.name,type:e.type,settings:o}},c=>{chrome.runtime.lastError?(console.error("[UploadInterceptor] SW message error:",chrome.runtime.lastError.message),t({success:!1,error:chrome.runtime.lastError.message})):t(c||{success:!1,error:"No response from Service Worker"})})
        });
        if(n&&n.success&&n.data){
          const t=n.data;let c;
          t.base64Data?c=base64ToArrayBuffer(t.base64Data):c=t.arrayBuffer||r;
          const l=new Blob([c],{type:t.type}),m=new File([l],t.name,{type:t.type,lastModified:Date.now()});
          return{success:!0,originalFile:e,protectedFile:m,phash:t.phash,whash:t.whash,metadata:{name:e.name,size:e.size,type:e.type},detections:t.detections,risk:t.risk,protectionSummary:t.protectionSummary}
        }else throw new Error(n&&n.error||"Failed protection pipeline execution")
      }catch(r){
        return console.error("[UploadInterceptor] Pipeline delegation failed. Falling back to original:",e.name,r),{success:!1,originalFile:e,protectedFile:e,phash:"",whash:"",metadata:{name:e.name,size:e.size,type:e.type},detections:[],risk:"low",protectionSummary:{processingTime:0,redacted:!1},error:r.message}
      }
    }));

    return await Promise.all(s.map(async e=>{
      if(!e.success||typeof chrome==="undefined"||!chrome?.runtime?.sendMessage) return;
      let r=null;
      try{
        console.log("[UploadInterceptor] Delegating asset registration to SW to bypass host CSP restrictions...");
        const i=await e.protectedFile.arrayBuffer();
        const base64Protected = arrayBufferToBase64(i);
        const t=await new Promise(c=>{
          chrome.runtime.sendMessage({type:"REGISTER_BACKEND_ASSET",payload:{base64Data:base64Protected,name:e.protectedFile.name,type:e.protectedFile.type,blur_enabled:o.blurMode==="blur"&&e.protectionSummary.redacted?"true":"false",ai_cloak:o.aiCloakEnabled&&e.protectionSummary.redacted?"true":"false",watermark:o.watermarkEnabled&&e.protectionSummary.redacted?"true":"false"}},l=>{chrome.runtime.lastError?c({success:!1,error:chrome.runtime.lastError.message}):c(l||{success:!1})})
        });
        t&&t.success&&t.data&&(r=t.data.assetId,console.log("[UploadInterceptor] Safely registered asset via Background Worker. ID:",r))
      }catch(i){console.warn("[UploadInterceptor] Background asset registration messaging failed:", i.message)}
      
      try{
        const i=e.detections.reduce((n,t)=>Math.max(n,t.fusedConfidence||0),0)||.8;
        await chrome.runtime.sendMessage({type:"LOG_SCAN",payload:{scanId:`scan_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,fileName:e.originalFile.name,size:e.originalFile.size,riskLevel:e.risk,confidence:parseFloat(i.toFixed(2)),piiCount:e.detections.length,processingTime:e.protectionSummary.processingTime,status:e.protectionSummary.redacted?"protected":"passed",detections:e.detections,assetId:r}});
        window.postMessage({ type: 'SAFELENS_SCAN_COMPLETED' }, '*');
      }catch(i){console.warn("[UploadInterceptor] Failed to dispatch scan log metrics:",i)}
    })),s}

  const P=Object.freeze(Object.defineProperty({__proto__:null,interceptUpload:k},Symbol.toStringTag,{value:"Module"}));
  let y=null;const g=new Map;
  function h(a){return a.isSafeLensTriggered===!0||a.detail&&a.detail.isSafeLensTriggered===!0}

  function f(a){
    return function(o){
      if(h(o))return;let s=null;const e=o.target;
      if(a==="change"&&o.target.files?s=o.target.files:a==="drop"&&o.dataTransfer?s=o.dataTransfer.files:a==="paste"&&o.clipboardData&&(s=o.clipboardData.files),!s||s.length===0)return;
      o.preventDefault(),o.stopImmediatePropagation(),S(s,e,i=>{
        console.log(`[DOMObserver] Re-injecting and triggering event: ${a} on targetElement: ${e?e.constructor.name:"null"}`,{fileCount:i.length});
        const n=new DataTransfer;
        if(Array.from(i).forEach(t=>n.items.add(t)),a==="change"){
          e instanceof HTMLInputElement&&(e.files=n.files);const t=new Event("change",{bubbles:!0,cancelable:!0});t.isSafeLensTriggered=!0,e.dispatchEvent(t)
        }else if(a==="drop"){
          const t=new DragEvent("drop",{bubbles:!0,cancelable:!0,dataTransfer:n});t.isSafeLensTriggered=!0,e.dispatchEvent(t)
        }else if(a==="paste"){
          const t=new ClipboardEvent("paste",{bubbles:!0,cancelable:!0,clipboardData:n});t.isSafeLensTriggered=!0,e.dispatchEvent(t)
        }
      },P)
    }
  }

  const u={change:f("change"),drop:f("drop"),paste:f("paste")};
  function w(a){h(a)||a.preventDefault()}
  
  function d(a,o,s){
    if(g.size>200)for(const r of g.keys())r.isConnected||g.delete(r);
    g.has(a)||g.set(a,{});const e=g.get(a);e[o]||(a.addEventListener(o,s,!0),e[o]=s)
  }

  function x(a){
    if(!a||typeof a.querySelectorAll!="function")return;
    a.querySelectorAll('input[type="file"]').forEach(r=>{d(r,"change",u.change)});
    a.querySelectorAll('[class*="drop"], [class*="upload"], [id*="drop"], [id*="upload"], [role="button"], #pickfiles, .uploader, .tool__workarea, [class*="file"], [id*="file"]').forEach(r=>{d(r,"dragover",w),d(r,"drop",u.drop)});
    a.querySelectorAll('textarea, [contenteditable="true"]').forEach(r=>{d(r,"paste",u.paste)})
  }

  function U(){
    x(document),document.body&&(y=new MutationObserver(a=>{for(const o of a)o.type==="childList"&&o.addedNodes.forEach(s=>{s.nodeType===Node.ELEMENT_NODE&&x(s)})}),y.observe(document.body,{childList:!0,subtree:!0})),d(document,"change",u.change),d(document,"dragover",w),d(document,"drop",u.drop),d(document,"paste",u.paste)
  }

  try{U()}catch(a){console.error("[SafeLens] Failed to initialize content observers:",a)}
})();