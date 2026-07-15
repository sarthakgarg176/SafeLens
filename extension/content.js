(function () {
  const extensionName = "SafeLens Privacy Shield AI";
  console.log(
    `%c[${extensionName}]%c Content script injected and initialized successfully. Watching for file uploads.`,
    "color: #7c3aed; font-weight: bold; font-size: 11px;",
    "color: #a78bfa; font-weight: normal;"
  );

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convert base64 dataURL to File object
  function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  async function handleFileSelect(file, inputElement) {
    if (!file || !file.type.startsWith("image/")) return;
    console.log(`[${extensionName}] Image detected:`, file.name, file.type);

    try {
      const dataUrl = await fileToDataURL(file);

      chrome.runtime.sendMessage(
        { action: "START_SCAN", payload: { image: dataUrl } },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(`[${extensionName}] Message error:`, chrome.runtime.lastError.message);
            return;
          }

          console.log(`[${extensionName}] Scan response:`, response);

          if (response?.status === "success") {
            const { hitsCount, riskScore, recommendation, redactedImage } = response.data;

            console.log(
              `%c[${extensionName}] Scan complete -> hits: ${hitsCount}, risk: ${riskScore}, recommendation: ${recommendation}`,
              "color: #16a34a; font-weight: bold;"
            );

            // Agar redaction zaruri hai aur redactedImage available hai
            if (recommendation === "REDACT_MANDATORY" && redactedImage && inputElement) {
              console.log(`[${extensionName}] Replacing upload with redacted image...`);

              // Redacted image ko File object mein convert karo
              const redactedFile = dataURLtoFile(redactedImage, file.name);

              // DataTransfer use karke input ki files replace karo
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(redactedFile);
              inputElement.files = dataTransfer.files;

              // Change event trigger karo taaki site ko pata chale
              inputElement.dispatchEvent(new Event('change', { bubbles: true }));

              console.log(`[${extensionName}] Upload replaced with redacted image successfully!`);
            }
          }
        }
      );
    } catch (err) {
      console.error(`[${extensionName}] Failed to process file:`, err);
    }
  }

  function attachToFileInputs() {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((input) => {
      if (input.dataset.safelensAttached) return;
      input.dataset.safelensAttached = "true";
      input.addEventListener("change", (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          handleFileSelect(files[0], input);
        }
      });
    });
  }

  attachToFileInputs();

  const observer = new MutationObserver(() => {
    attachToFileInputs();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();