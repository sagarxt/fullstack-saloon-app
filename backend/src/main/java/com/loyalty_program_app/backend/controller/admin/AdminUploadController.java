package com.loyalty_program_app.backend.controller.admin;

import com.loyalty_program_app.backend.service.utils.CloudinaryService;
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
            @RequestParam(value = "folder", defaultValue = "groomishnow") String folder
    ) {
        String uploadedUrl;
        if (file != null && !file.isEmpty()) {
            uploadedUrl = cloudinaryService.uploadImage(file, folder);
        } else if (fileUrl != null && !fileUrl.isBlank()) {
            uploadedUrl = cloudinaryService.upload(fileUrl.trim(), folder);
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "No file or fileUrl provided"));
        }

        return ResponseEntity.ok(Map.of(
                "url", uploadedUrl != null ? uploadedUrl : "",
                "folder", folder
        ));
    }
}
