package com.groomish_now.backend.service.admin.impl;

import com.groomish_now.backend.dto.service.ServiceResponse;
import com.groomish_now.backend.dto.service.SubServiceDto;
import com.groomish_now.backend.enums.Gender;
import com.groomish_now.backend.enums.ServiceGender;
import com.groomish_now.backend.model.Category;
import com.groomish_now.backend.model.ServiceEntity;
import com.groomish_now.backend.model.SubService;
import com.groomish_now.backend.repository.CategoryRepository;
import com.groomish_now.backend.repository.ServiceRepository;
import com.groomish_now.backend.service.utils.CloudinaryService;
import com.groomish_now.backend.service.admin.ServiceAdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class ServiceAdminServiceImpl implements ServiceAdminService {

    private final ServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    public ServiceAdminServiceImpl(
            ServiceRepository serviceRepository,
            CategoryRepository categoryRepository,
            CloudinaryService cloudinaryService
    ) {
        this.serviceRepository = serviceRepository;
        this.categoryRepository = categoryRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public ServiceResponse createService(String name, UUID categoryId, String description, String gender,
                                         Double mrp, Double price, Integer rewards, Integer durationMinutes,
                                         MultipartFile image) {
        return createService(name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, null);
    }

    @Override
    public ServiceResponse createService(String name, UUID categoryId, String description, String gender,
                                         Double mrp, Double price, Integer rewards, Integer durationMinutes,
                                         MultipartFile image, String imageUrl) {
        return createService(name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, null);
    }

    @Override
    public ServiceResponse createService(String name, UUID categoryId, String description, String gender,
                                         Double mrp, Double price, Integer rewards, Integer durationMinutes,
                                         MultipartFile image, String imageUrl,
                                         java.util.List<SubServiceDto> subServices) {
        return createService(name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, subServices, true);
    }

    @Override
    public ServiceResponse createService(String name, UUID categoryId, String description, String gender,
                                         Double mrp, Double price, Integer rewards, Integer durationMinutes,
                                         MultipartFile image, String imageUrl,
                                         java.util.List<SubServiceDto> subServices,
                                         Boolean active) {

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        String finalImageUrl = null;
        if (image != null && !image.isEmpty()) {
            finalImageUrl = cloudinaryService.uploadImage(image, "groomishnow/service", name);
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            String trimmedUrl = imageUrl.trim();
            if (!trimmedUrl.contains("cloudinary.com")) {
                finalImageUrl = cloudinaryService.upload(trimmedUrl, "groomishnow/service", name);
            } else {
                finalImageUrl = trimmedUrl;
            }
        }

        ServiceEntity s = new ServiceEntity();
        s.setName(name);
        s.setCategory(category);
        s.setDescription(description);
        s.setGender(gender != null ? ServiceGender.valueOf(gender.toUpperCase()) : ServiceGender.UNISEX);
        s.setMrp(mrp != null ? mrp : price);
        s.setPrice(price);
        s.setRewards(rewards != null ? rewards : 0);
        s.setDurationMinutes(durationMinutes != null ? durationMinutes : 30);
        s.setImage(finalImageUrl);
        s.setActive(active != null ? active : true);

        if (subServices != null && !subServices.isEmpty()) {
            for (SubServiceDto subDto : subServices) {
                if (subDto.getName() != null && !subDto.getName().isBlank()) {
                    SubService sub = SubService.builder()
                            .service(s)
                            .name(subDto.getName().trim())
                            .description(subDto.getDescription())
                            .mrp(subDto.getMrp())
                            .price(subDto.getPrice() != null ? subDto.getPrice() : (price != null ? price : 0.0))
                            .durationMinutes(subDto.getDurationMinutes() != null ? subDto.getDurationMinutes() : (durationMinutes != null ? durationMinutes : 30))
                            .active(subDto.getActive() != null ? subDto.getActive() : true)
                            .build();
                    s.getSubServices().add(sub);
                }
            }
            if ((s.getPrice() == null || s.getPrice() == 0.0) && !s.getSubServices().isEmpty()) {
                double minP = s.getSubServices().stream().mapToDouble(SubService::getPrice).min().orElse(0.0);
                s.setPrice(minP);
            }
            if ((s.getMrp() == null || s.getMrp() == 0.0) && !s.getSubServices().isEmpty()) {
                double minMrp = s.getSubServices().stream()
                        .mapToDouble(sub -> sub.getMrp() != null ? sub.getMrp() : sub.getPrice())
                        .min().orElse(s.getPrice() != null ? s.getPrice() : 0.0);
                s.setMrp(minMrp);
            }
            if ((s.getDurationMinutes() == null || s.getDurationMinutes() == 0) && !s.getSubServices().isEmpty()) {
                int minDur = s.getSubServices().stream()
                        .mapToInt(sub -> sub.getDurationMinutes() != null ? sub.getDurationMinutes() : 30)
                        .min().orElse(30);
                s.setDurationMinutes(minDur);
            }
        }

        serviceRepository.save(s);
        return toDto(s);
    }

    @Override
    public ServiceResponse updateService(UUID id, String name, UUID categoryId, String description,
                                         String gender, Double mrp, Double price, Integer rewards,
                                         Integer durationMinutes, MultipartFile image) {
        return updateService(id, name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, null);
    }

    @Override
    public ServiceResponse updateService(UUID id, String name, UUID categoryId, String description,
                                         String gender, Double mrp, Double price, Integer rewards,
                                         Integer durationMinutes, MultipartFile image, String imageUrl) {
        return updateService(id, name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, null);
    }

    @Override
    public ServiceResponse updateService(UUID id, String name, UUID categoryId, String description,
                                         String gender, Double mrp, Double price, Integer rewards,
                                         Integer durationMinutes, MultipartFile image, String imageUrl,
                                         java.util.List<SubServiceDto> subServices) {
        return updateService(id, name, categoryId, description, gender, mrp, price, rewards, durationMinutes, image, imageUrl, subServices, null);
    }

    @Override
    public ServiceResponse updateService(UUID id, String name, UUID categoryId, String description,
                                         String gender, Double mrp, Double price, Integer rewards,
                                         Integer durationMinutes, MultipartFile image, String imageUrl,
                                         java.util.List<SubServiceDto> subServices,
                                         Boolean active) {

        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (name != null) s.setName(name);
        if (description != null) s.setDescription(description);
        if (gender != null) s.setGender(ServiceGender.valueOf(gender.toUpperCase()));
        if (mrp != null) s.setMrp(mrp);
        if (price != null) s.setPrice(price);
        if (rewards != null) s.setRewards(rewards);
        if (durationMinutes != null) s.setDurationMinutes(durationMinutes);
        if (active != null) s.setActive(active);

        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            s.setCategory(category);
        }

        String targetName = (name != null && !name.isBlank()) ? name : s.getName();
        if (image != null && !image.isEmpty()) {
            String url = cloudinaryService.uploadImage(image, "groomishnow/service", targetName);
            s.setImage(url);
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            String trimmedUrl = imageUrl.trim();
            if (!trimmedUrl.contains("cloudinary.com")) {
                s.setImage(cloudinaryService.upload(trimmedUrl, "groomishnow/service", targetName));
            } else {
                s.setImage(trimmedUrl);
            }
        }

        if (subServices != null) {
            s.getSubServices().clear();
            for (SubServiceDto subDto : subServices) {
                if (subDto.getName() != null && !subDto.getName().isBlank()) {
                    SubService sub = SubService.builder()
                            .service(s)
                            .name(subDto.getName().trim())
                            .description(subDto.getDescription())
                            .mrp(subDto.getMrp())
                            .price(subDto.getPrice() != null ? subDto.getPrice() : (s.getPrice() != null ? s.getPrice() : 0.0))
                            .durationMinutes(subDto.getDurationMinutes() != null ? subDto.getDurationMinutes() : (s.getDurationMinutes() != null ? s.getDurationMinutes() : 30))
                            .active(subDto.getActive() != null ? subDto.getActive() : true)
                            .build();
                    s.getSubServices().add(sub);
                }
            }
            if (!s.getSubServices().isEmpty()) {
                if (s.getPrice() == null || s.getPrice() == 0.0) {
                    double minP = s.getSubServices().stream().mapToDouble(SubService::getPrice).min().orElse(0.0);
                    s.setPrice(minP);
                }
                if (s.getMrp() == null || s.getMrp() == 0.0) {
                    double minMrp = s.getSubServices().stream()
                            .mapToDouble(sub -> sub.getMrp() != null ? sub.getMrp() : sub.getPrice())
                            .min().orElse(s.getPrice() != null ? s.getPrice() : 0.0);
                    s.setMrp(minMrp);
                }
                if (s.getDurationMinutes() == null || s.getDurationMinutes() == 0) {
                    int minDur = s.getSubServices().stream()
                            .mapToInt(sub -> sub.getDurationMinutes() != null ? sub.getDurationMinutes() : 30)
                            .min().orElse(30);
                    s.setDurationMinutes(minDur);
                }
            }
        }

        serviceRepository.save(s);
        return toDto(s);
    }

    @Override
    public ServiceResponse updateServiceStatus(UUID id, Boolean active) {
        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        if (active != null) {
            s.setActive(active);
        } else {
            s.setActive(!s.isActive());
        }
        serviceRepository.save(s);
        return toDto(s);
    }

    @Override
    public void softDeleteService(UUID id) {
        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        s.setActive(false);
        serviceRepository.save(s);
    }

    @Override
    public ServiceResponse getService(UUID id) {
        ServiceEntity s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        return toDto(s);
    }

    @Override
    public Page<ServiceResponse> searchServices(String name, UUID categoryId, String gender,
                                                Boolean active, Double minPrice, Double maxPrice,
                                                Pageable pageable) {

        Specification<ServiceEntity> spec = Specification.allOf();

        if (name != null && !name.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId));
        }
        if (gender != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("gender"), Gender.valueOf(gender)));
        }
        if (active != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("active"), active));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }

        return serviceRepository.findAll(spec, pageable).map(this::toDto);
    }

    private ServiceResponse toDto(ServiceEntity s) {
        ServiceResponse dto = new ServiceResponse();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setDescription(s.getDescription());
        dto.setImage(s.getImage());
        dto.setGender(s.getGender().name());
        dto.setMrp(s.getMrp());
        dto.setPrice(s.getPrice());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setRewards(s.getRewards());
        dto.setCategoryId(s.getCategory().getId());
        dto.setCategoryName(s.getCategory().getName());
        dto.setActive(s.isActive());

        if (s.getSubServices() != null) {
            dto.setSubServices(s.getSubServices().stream()
                    .map(sub -> SubServiceDto.builder()
                            .id(sub.getId())
                            .name(sub.getName())
                            .description(sub.getDescription())
                            .mrp(sub.getMrp())
                            .price(sub.getPrice())
                            .durationMinutes(sub.getDurationMinutes())
                            .active(sub.isActive())
                            .build())
                    .toList());
        }
        return dto;
    }
}
