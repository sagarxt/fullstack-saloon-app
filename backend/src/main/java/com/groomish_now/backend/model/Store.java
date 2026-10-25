package com.groomish_now.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Store {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code; // e.g. "GN-BLR-INDIRA"

    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;

    @Column(length = 1024)
    private String image; // Cloudinary primary URL

    @Column(length = 1024)
    private String logo; // Cloudinary logo URL

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "store_images", joinColumns = @JoinColumn(name = "store_id"))
    @Column(name = "image_url", length = 1024)
    @Builder.Default
    private java.util.List<String> images = new java.util.ArrayList<>();

    public java.util.List<String> getImages() {
        if (images == null) {
            images = new java.util.ArrayList<>();
        }
        if (images.isEmpty() && image != null && !image.isBlank()) {
            images.add(image);
        }
        return images;
    }

    private Double latitude;
    private Double longitude;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private String openingTime = "09:00 AM";

    @Builder.Default
    private String closingTime = "09:00 PM";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
