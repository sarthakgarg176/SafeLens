# decoy_synthesis/synthesizer.py

import re
from decoy_synthesis.algorithms.verhoeff import Verhoeff
from decoy_synthesis.algorithms.luhn import Luhn
from decoy_synthesis.algorithms.pattern_regex import PatternSynthesizer

class DecoySynthesizer:
    """
    Master Synthesizer that identifies incoming PII pattern types 
    and dispatches requests to the appropriate mathematical/pattern algorithm.
    """

    def __init__(self):
        # Regex patterns for identification
        self.aadhaar_pattern = re.compile(r'^[2-9]\d{11}$')
        self.pan_pattern = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
        self.phone_pattern = re.compile(r'^[6-9]\d{9}$')
        self.card_pattern = re.compile(r'^\d{15,16}$')

    def synthesize(self, pii_type: str, original_value: str = None) -> str:
        """
        Dispatches synthesis based on explicit type or auto-detection.
        """
        pii_type_upper = pii_type.upper()

        if pii_type_upper in ["AADHAAR", "UIDAI"]:
            return Verhoeff.generate_synthetic_aadhaar()

        elif pii_type_upper in ["CARD", "CREDIT_CARD", "DEBIT_CARD"]:
            return Luhn.generate_synthetic_card()

        elif pii_type_upper == "PAN":
            return PatternSynthesizer.generate_pan()

        elif pii_type_upper in ["PHONE", "MOBILE"]:
            return PatternSynthesizer.generate_phone()

        elif pii_type_upper == "UPI":
            return PatternSynthesizer.generate_upi()

        elif pii_type_upper == "EMAIL":
            return PatternSynthesizer.generate_email()

        else:
            # General fallback: scrambled length-preserving placeholder
            if original_value:
                return "".join(["X" if c.isalnum() else c for c in original_value])
            return "DEC-SAFE-VALUE-001"

# Quick Verification
if __name__ == "__main__":
    synth = DecoySynthesizer()
    print("Test Aadhaar Decoy:", synth.synthesize("AADHAAR"))
    print("Test Card Decoy:   ", synth.synthesize("CARD"))
    print("Test PAN Decoy:    ", synth.synthesize("PAN"))