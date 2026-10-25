package com.groomish_now.backend.controller.admin;

import com.groomish_now.backend.service.utils.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/upload")
@RequiredArgsConstructor
public class AdminUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "fileUrl", required = false) String fileUrl,
            @RequestParam(value = "folder", defaultValue = "groomishnow") String folder,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "publicId", required = false) String publicId
    ) {
        String targetPublicId = (publicId != null && !publicId.isBlank()) ? publicId : name;
        String uploadedUrl;
        if (file != null && !file.isEmpty()) {
            uploadedUrl = cloudinaryService.uploadImage(file, folder, targetPublicId);
        } else if (fileUrl != null && !fileUrl.isBlank()) {
            uploadedUrl = cloudinaryService.upload(fileUrl.trim(), folder, targetPublicId);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "No file or fileUrl provided"));
        }

        return ResponseEntity.ok(Map.of(
                "url", uploadedUrl != null ? uploadedUrl : "",
                "folder", folder,
                "publicId", targetPublicId != null ? targetPublicId : ""
        ));
    }
}
