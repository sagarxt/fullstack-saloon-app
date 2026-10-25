package com.groomish_now.backend.util;

import com.groomish_now.backend.repository.BookingRepository;
import java.security.SecureRandom;

public final class BookingCodeGenerator {

    // Uppercase alphanumeric characters excluding confusing glyphs (0, O, 1, I)
    private static final String ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private BookingCodeGenerator() {
    }

    /**
     * Generates a 10-character unique booking identifier formatted for optimal human readability:
     * Format: GN-[2 Alphanumeric]-[6 Digits]
     * Example: GN-7K-481920
     */
    public static String generateUniqueCode(BookingRepository repository) {
        String code;
        int attempts = 0;
        do {
            code = generateCode();
            attempts++;
            if (attempts > 50) {
                // Failsafe with timestamp chunk
                return String.format("GN-%02X-%06d", (int) (System.currentTimeMillis() % 256), RANDOM.nextInt(900000) + 100000);
            }
        } while (repository != null && repository.existsByBookingCode(code));

        return code;
    }

    public static String generateCode() {
        char c1 = ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length()));
        char c2 = ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length()));
        int digits = RANDOM.nextInt(900000) + 100000; // Guaranteed 6-digit random number (100000..999999)
        return String.format("GN-%c%c-%06d", c1, c2, digits);
    }
}
