package com.loyalty_program_app.backend.service.utils.impl;

import com.loyalty_program_app.backend.service.utils.OtpService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpServiceImpl implements OtpService {

    // memory storage: email => [otp, expiry time]
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    @Override
    public String generateOtp(String email) {
        String otp = String.valueOf((int)(Math.random() * 900000 + 100000));
        otpStore.put(email, new OtpData(otp, LocalDateTime.now().plusMinutes(10)));
        return otp;
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        if (!otpStore.containsKey(email)) return false;

        OtpData data = otpStore.get(email);

        if (data.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }

        boolean valid = data.otp.equals(otp);

        if (valid) otpStore.remove(email);

        return valid;
    }

    private record OtpData(String otp, LocalDateTime expiry) {}
}
