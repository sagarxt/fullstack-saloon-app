package com.loyalty_program_app.backend.service.utils.impl;

import com.cloudinary.Cloudinary;
import com.loyalty_program_app.backend.service.utils.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadImage(MultipartFile file) {
        return uploadImage(file, "groomishnow");
    }

    @Override
    public String uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) return null;
        try {
            return upload(file.getBytes(), folder);
        } catch (IOException e) {
            log.error("Failed to read multipart file bytes", e);
            throw new RuntimeException("Failed to read image file", e);
        }
    }

    @Override
    public String upload(Object fileSource, String folder) {
        if (fileSource == null) return null;
        if (fileSource instanceof String str && str.trim().isEmpty()) return null;

        String targetFolder = (folder != null && !folder.trim().isEmpty())
                ? folder.trim()
                : "groomishnow";

        try {
            Map<String, Object> options = new HashMap<>();
            options.put("folder", targetFolder);
            options.put("resource_type", "auto");

            Map<?, ?> uploadResult = cloudinary.uploader().upload(fileSource, options);
            String secureUrl = (String) uploadResult.get("secure_url");
            return secureUrl != null ? secureUrl : (String) uploadResult.get("url");
        } catch (Exception e) {
            log.error("Cloudinary upload failed for folder '{}': {}", targetFolder, e.getMessage(), e);
            throw new RuntimeException("Failed to upload image to Cloudinary: " + e.getMessage(), e);
        }
    }
}
