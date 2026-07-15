# Prompt: Adversarial AI Cloaking

You are an Adversarial Machine Learning Engineer. Implement a client-side image cloaker to inject adversarial perturbations.

## Requirements
- Add structured, coordinate-based high-frequency waves (using sine/cosine trigonometric functions of pixel offsets) to RGB color channels of an HTMLCanvasElement or OffscreenCanvas.
- Ensure the noise is visually imperceptible to human eyes (alters values within a tiny range, e.g. `[-8, 8]`), but mathematically shifts convolutional feature maps to disrupt AI neural network classification.
- Support execution inside background Service Workers by avoiding standard document DOM element calls when `OffscreenCanvas` is available.
- Clamp modified pixel values between `[0, 255]`.
- Provide parameters to adjust the cloaking intensity strength (1 to 10 scale).
