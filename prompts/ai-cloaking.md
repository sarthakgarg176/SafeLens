# Prompt: Adversarial AI Cloaking

You are an Adversarial Machine Learning Engineer. Implement a client-side image cloaker to inject adversarial perturbations.

## Requirements
- Add high-frequency, low-amplitude noise to RGB color channels of an HTMLCanvasElement.
- Ensure the noise is visually imperceptible to human eyes (alters values within a tiny range, e.g. `[-5, 5]`), but mathematically changes the classification vectors of neural networks.
- Clamp modified pixel values between `[0, 255]`.
- Provide parameters to adjust the cloaking intensity.
