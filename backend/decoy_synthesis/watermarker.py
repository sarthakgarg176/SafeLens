# decoy_synthesis/watermarker.py

import os
from PIL import Image, ImageDraw, ImageFont

class VisualWatermarker:
    """
    Applies a semi-transparent 'SYNTHETIC DECOY' watermark overlay 
    on uploaded images to prevent visual PII leakage.
    """

    @classmethod
    def apply_decoy_stamp(cls, input_image_path: str, output_image_path: str, pii_boxes=None) -> bool:
        """
        Reads an image, applies solid black redaction boxes over PII coordinates,
        applies a diagonal watermark overlay, and saves the safe copy.
        """
        try:
            # Open the base image and convert to RGBA
            base_image = Image.open(input_image_path).convert("RGBA")
            width, height = base_image.size
            
            # Create a transparent overlay layer
            overlay = Image.new("RGBA", base_image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)

            # 1. Draw solid black redaction boxes over PII text coordinates
            if pii_boxes:
                for box in pii_boxes:
                    x, y, w, h = box.get('x', 0), box.get('y', 0), box.get('w', 0), box.get('h', 0)
                    # Draw solid black rectangle over detected PII coordinates
                    draw.rectangle([x, y, x + w, y + h], fill=(0, 0, 0, 255))
            else:
                # Default safety PII redaction bands across center PII credential areas
                box_w = int(width * 0.75)
                box_h = max(24, int(height * 0.08))
                x_start = (width - box_w) // 2
                
                y1 = int(height * 0.45)
                y2 = int(height * 0.65)
                
                draw.rectangle([x_start, y1, x_start + box_w, y1 + box_h], fill=(0, 0, 0, 255))
                draw.rectangle([x_start, y2, x_start + box_w, y2 + box_h], fill=(0, 0, 0, 255))
            
            # 2. Add diagonal SAFELENS watermark overlay
            watermark_text = "SAFELENS DECOY - PII REDACTED"
            try:
                font_size = max(20, int(width / 14))
                font = ImageFont.truetype("arial.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()

            bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x_center = (width - text_width) // 2
            y_center = (height - text_height) // 2
            
            # Draw semi-transparent Red watermark
            draw.text((x_center, y_center), watermark_text, font=font, fill=(255, 0, 0, 160))
            
            # Composite overlay onto base image
            watermarked_image = Image.alpha_composite(base_image, overlay)
            watermarked_image.convert("RGB").save(output_image_path)
            print(f"[SUCCESS] Black box PII redaction and watermark applied. Safe copy at: {output_image_path}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to apply redaction watermark: {e}")
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