package com.groomish_now.backend.service.utils.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.groomish_now.backend.service.utils.CloudinaryService;
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
        return uploadImage(file, "groomishnow", null);
    }

    @Override
    public String uploadImage(MultipartFile file, String folder) {
        return uploadImage(file, folder, null);
    }

    @Override
    public String uploadImage(MultipartFile file, String folder, String publicId) {
        if (file == null || file.isEmpty()) return null;
        try {
            return upload(file.getBytes(), folder, publicId);
        } catch (IOException e) {
            log.error("Failed to read multipart file bytes", e);
            throw new RuntimeException("Failed to read image file", e);
        }
    }

    @Override
    public String upload(Object fileSource, String folder) {
        return upload(fileSource, folder, null);
    }

    @Override
    public String upload(Object fileSource, String folder, String publicId) {
        if (fileSource == null) return null;
        if (fileSource instanceof String str && str.trim().isEmpty()) return null;

        String targetFolder = (folder != null && !folder.trim().isEmpty())
                ? folder.trim()
                : "groomishnow";

        try {
            Map<String, Object> options = new HashMap<>();
            options.put("folder", targetFolder);
            options.put("resource_type", "auto");
            options.put("transformation", new Transformation()
                    .quality("auto").chain()
                    .width(800).crop("scale"));

            if (publicId != null && !publicId.trim().isEmpty()) {
                String cleanId = slugify(publicId);
                // Strip folder prefix if publicId already has folder in it
                String folderSlug = slugify(targetFolder);
                if (cleanId.startsWith(folderSlug + "-") || cleanId.startsWith(folderSlug + "_")) {
                    cleanId = cleanId.substring(folderSlug.length() + 1);
                }
                if (!cleanId.isEmpty()) {
                    options.put("public_id", cleanId);
                    options.put("overwrite", true);
                    options.put("invalidate", true);
                    options.put("unique_filename", false);
                }
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(fileSource, options);
            String secureUrl = (String) uploadResult.get("secure_url");
            return secureUrl != null ? secureUrl : (String) uploadResult.get("url");
        } catch (Exception e) {
            log.error("Cloudinary upload failed for folder '{}' with publicId '{}': {}", targetFolder, publicId, e.getMessage(), e);
            throw new RuntimeException("Failed to upload image to Cloudinary: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateUrl(String publicId) {
        if (publicId == null || publicId.isBlank()) return null;
        return cloudinary.url()
                .transformation(new Transformation()
                        .quality("auto").chain()
                        .width(800).crop("scale"))
                .generate(publicId);
    }

    @Override
    public String imageTag(String publicId) {
        if (publicId == null || publicId.isBlank()) return "";
        return cloudinary.url()
                .transformation(new Transformation()
                        .quality("auto").chain()
                        .width(800).crop("scale"))
                .imageTag(publicId);
    }

    /**
     * Convert an entity name into a clean, safe Cloudinary public_id slug.
     * e.g., "Hair Care & Styling" -> "hair-care-and-styling"
     */
    public static String slugify(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        String s = input.trim().toLowerCase();
        s = s.replace("&", "and");
        s = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        s = s.replaceAll("[^a-z0-9_-]+", "-");
        s = s.replaceAll("-+", "-");
        s = s.replaceAll("^-|-$", "");
        if (s.length() > 80) {
            s = s.substring(0, 80).replaceAll("-$", "");
        }
        return s;
    }
}
