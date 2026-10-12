package com.loyalty_program_app.backend.util;

import com.loyalty_program_app.backend.repository.UserRepository;
import java.security.SecureRandom;

public final class ReferralCodeGenerator {

    // Uppercase alphanumeric characters excluding ambiguous characters (0, O, 1, I)
    private static final String ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private ReferralCodeGenerator() {
    }

    /**
     * Generates a 6-character referral code:
     * - First 3 characters: First 3 letters of the person's name in uppercase (padded if < 3 letters)
     * - Last 3 characters: 3 random alphanumeric characters (letters & numbers)
     * 
     * Examples:
     * - "Sagar"  -> "SAG8K2"
     * - "Priya"  -> "PRI4M9"
     * - "Al"     -> "ALX7B3"
     * Total length: exactly 6 characters.
     */
    public static String generateUniqueReferralCode(String name, UserRepository userRepository) {
        String prefix = extractPrefix(name);
        String code;
        int attempts = 0;

        do {
            code = prefix + randomAlphanumeric(3);
            attempts++;
            if (attempts > 50) {
                // Failsafe with extra random chars
                return prefix + randomAlphanumeric(3);
            }
        } while (userRepository != null && userRepository.findByReferralCode(code).isPresent());

        return code;
    }

    private static String extractPrefix(String name) {
        String clean = (name != null ? name.replaceAll("[^A-Za-z]", "") : "").toUpperCase();
        if (clean.length() >= 3) {
            return clean.substring(0, 3);
        }
        // Pad with LUXE if name has fewer than 3 letters
        return (clean + "LUXE").substring(0, 3);
    }

    private static String randomAlphanumeric(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}
