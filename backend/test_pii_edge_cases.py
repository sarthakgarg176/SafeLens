# test_pii_edge_cases.py

from decoy_synthesis.synthesizer import DecoySynthesizer

def run_pii_edge_case_tests():
    print("=== STARTING PII EDGE-CASE & BOUNDARY TEST ===\n")
    synth = DecoySynthesizer()

    test_cases = [
        ("AADHAAR", "234567890123", "Valid 12-digit Aadhaar"),
        ("CARD", "4111111111111111", "Visa Card Structure"),
        ("CARD", "5500000000000004", "Mastercard Structure"),
        ("PAN", "ABCDE1234F", "Standard PAN Format"),
        ("UPI", "user.name@okaxis", "Complex Handle UPI"),
        ("EMAIL", "john.doe+test@domain.co.in", "Subdomain/Plus Email"),
        ("UNKNOWN_TYPE", "Confidential Note 123", "Fallback Structural Masking")
    ]

    for pii_type, raw_val, description in test_cases:
        decoy_val = synth.synthesize(pii_type, raw_val)
        print(f"[{description}]")
        print(f"  Input : {raw_val} ({pii_type})")
        print(f"  Decoy : {decoy_val}")
        print("-" * 65)

if __name__ == "__main__":
    run_pii_edge_case_tests()