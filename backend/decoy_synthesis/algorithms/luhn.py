# decoy_synthesis/algorithms/luhn.py

import random

class Luhn:
    """
    Implements the Luhn (Modulus 10) algorithm to generate mathematically 
    valid synthetic Credit/Debit Card numbers for decoy payloads.
    """

    @classmethod
    def calc_checksum(cls, card_number_str: str) -> int:
        """Calculates the Luhn checksum digit for a given card number prefix."""
        digits = [int(d) for d in card_number_str]
        
        # Double every second digit from right to left
        for i in range(len(digits) - 1, -1, -2):
            doubled = digits[i] * 2
            digits[i] = doubled - 9 if doubled > 9 else doubled

        total_sum = sum(digits)
        checksum = (10 - (total_sum % 10)) % 10
        return checksum

    @classmethod
    def generate_synthetic_card(cls, prefix: str = "400000", length: int = 16) -> str:
        """
        Generates a valid Luhn card number.
        Default prefix '400000' is a standard Visa Test BIN.
        """
        # Generate random digits for the body (length - len(prefix) - 1 for check digit)
        random_digits_needed = length - len(prefix) - 1
        body = ''.join([str(random.randint(0, 9)) for _ in range(random_digits_needed)])
        
        base_card = prefix + body
        checksum = cls.calc_checksum(base_card)
        
        return base_card + str(checksum)

# Quick Local Test
if __name__ == "__main__":
    fake_visa = Luhn.generate_synthetic_card(prefix="400000")
    fake_mastercard = Luhn.generate_synthetic_card(prefix="510000")
    
    print(f"Generated Synthetic Visa: {fake_visa}")
    print(f"Generated Synthetic Mastercard: {fake_mastercard}")