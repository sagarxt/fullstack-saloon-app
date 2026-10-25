package com.groomish_now.backend.service.utils;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadImage(MultipartFile file);
    String uploadImage(MultipartFile file, String folder);
    String uploadImage(MultipartFile file, String folder, String publicId);
    String upload(Object fileSource, String folder);
    String upload(Object fileSource, String folder, String publicId);
    String generateUrl(String publicId);
    String imageTag(String publicId);
}
