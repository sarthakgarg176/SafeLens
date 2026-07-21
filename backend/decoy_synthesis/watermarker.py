# decoy_synthesis/watermarker.py

import os
from PIL import Image, ImageDraw, ImageFont

class VisualWatermarker:
    """
    Applies a semi-transparent 'SYNTHETIC DECOY' watermark overlay 
    on uploaded images to prevent visual PII leakage.
    """

    @classmethod
    def apply_decoy_stamp(cls, input_image_path: str, output_image_path: str) -> bool:
        """
        Reads an image, applies a diagonal watermark, and saves the safe copy.
        """
        try:
            # Open the base image and convert to RGBA (for transparency)
            base_image = Image.open(input_image_path).convert("RGBA")
            width, height = base_image.size
            
            # Create a transparent overlay layer
            overlay = Image.new("RGBA", base_image.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(overlay)
            
            # Text to display
            watermark_text = "SAFELENS DECOY"
            
            # Try to load a larger font, fallback to default if not available
            try:
                # Use a standard Windows font if available, scaled to image size
                font_size = int(width / 10)
                font = ImageFont.truetype("arial.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()

            # Calculate text bounding box for centering
            bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Calculate position (Center)
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            # Draw semi-transparent Red text
            draw.text((x, y), watermark_text, font=font, fill=(255, 0, 0, 128))
            
            # Composite the overlay onto the base image
            watermarked_image = Image.alpha_composite(base_image, overlay)
            
            # Convert back to RGB and save (to support JPEG)
            watermarked_image.convert("RGB").save(output_image_path)
            print(f"[SUCCESS] Watermark applied. Safe image saved at: {output_image_path}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to apply watermark: {e}")
            return False

# Quick Local Test
if __name__ == "__main__":
    # Create a dummy image for testing if you don't have one
    dummy_path = "dummy_id.jpg"
    safe_path = "safe_dummy_id.jpg"
    
    if not os.path.exists(dummy_path):
        img = Image.new('RGB', (800, 400), color=(200, 200, 200))
        d = ImageDraw.Draw(img)
        d.text((350, 180), "MOCK ID CARD", fill=(0,0,0))
        img.save(dummy_path)
        print(f"Created temporary dummy image at {dummy_path}")

    # Test the watermarker
    VisualWatermarker.apply_decoy_stamp(dummy_path, safe_path)