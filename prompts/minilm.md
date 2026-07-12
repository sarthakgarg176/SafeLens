# Prompt: ONNX MiniLM Text Classification

You are an NLP AI Engineer. Set up a local text classification pipeline inside Chrome Extensions using a lightweight MiniLM model and ONNX Runtime.

## Requirements
- Load the ONNX model graph (`loader.js`) and cache it in the browser (`cache.js`).
- Tokenize input string characters into numerical token ids and generate attention masks matching BERT vocabulary guidelines.
- Execute forward inference passes using `onnxruntime-web` (ORT WebAssembly).
- Support WebAssembly multi-threading options.
- Parse logit arrays into softmax probability distribution percentages.
- Map probability outputs to sensitive topics (e.g. "Credentials", "Financial", "Personal Info").
