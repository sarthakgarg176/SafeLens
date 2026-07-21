# decoy_synthesis/algorithms/pattern_regex.py

import random
import string

class PatternSynthesizer:
    """
    Generates pattern-based synthetic data (PAN, Phone, UPI, Email) 
    using structural rules to bypass standard regex validations.
    """

    @classmethod
    def generate_pan(cls) -> str:
        """
        Generates a structurally valid synthetic PAN card number.
        Format: 5 Uppercase Letters, 4 Digits, 1 Uppercase Letter.
        """
        # Part 1: 5 Uppercase Letters (Usually first 3 are random, 4th is status (P,C,H etc), 5th is initial)
        # We randomize all to keep it simple but structurally valid.
        letters_part1 = ''.join(random.choices(string.ascii_uppercase, k=5))
        
        # Part 2: 4 Random Digits
        digits = ''.join(random.choices(string.digits, k=4))
        
        # Part 3: 1 Uppercase Letter
        letter_part2 = random.choice(string.ascii_uppercase)
        
        return f"{letters_part1}{digits}{letter_part2}"

    @classmethod
    def generate_phone(cls) -> str:
        """
        Generates a valid synthetic Indian mobile number.
        Format: Starts with 6, 7, 8, or 9 followed by 9 random digits.
        """
        first_digit = str(random.choice([6, 7, 8, 9]))
        rest_digits = ''.join(random.choices(string.digits, k=9))
        return f"{first_digit}{rest_digits}"

    @classmethod
    def generate_upi(cls) -> str:
        """
        Generates a plausible synthetic UPI ID.
        Format: alphanumeric_username@bank_handle
        """
        username_length = random.randint(6, 12)
        username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=username_length))
        
        # Common standard UPI handles used in India
        handles = ['okicici', 'okhdfcbank', 'sbi', 'paytm', 'ybl', 'apl']
        
        return f"{username}@{random.choice(handles)}"

    @classmethod
    def generate_email(cls) -> str:
        """
        Generates a synthetic email address for generic PII masking.
        """
        username_length = random.randint(6, 12)
        username = ''.join(random.choices(string.ascii_lowercase, k=username_length))
        
        # Using obvious fake domains so they aren't accidentally delivered
        domains = ['synthetic-mail.com', 'decoy-net.org', 'fake-company.in']
        
        return f"{username}@{random.choice(domains)}"

# Quick Local Test
if __name__ == "__main__":
    print(f"Generated Synthetic PAN:   {PatternSynthesizer.generate_pan()}")
    print(f"Generated Synthetic Phone: {PatternSynthesizer.generate_phone()}")
    print(f"Generated Synthetic UPI:   {PatternSynthesizer.generate_upi()}")
    print(f"Generated Synthetic Email: {PatternSynthesizer.generate_email()}")