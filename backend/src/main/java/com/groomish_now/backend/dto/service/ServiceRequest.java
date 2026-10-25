package com.groomish_now.backend.dto.service;

import java.util.UUID;
import java.util.List;

public class ServiceRequest {
    private String name;
    private UUID categoryId;
    private String image;
    private String description;
    private String gender;
    private Double mrp;
    private Double price;
    private Integer rewards;
    private Integer durationMinutes;
    private Boolean active;
    private List<SubServiceDto> subServices;

    public ServiceRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Double getMrp() { return mrp; }
    public void setMrp(Double mrp) { this.mrp = mrp; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getRewards() { return rewards; }
    public void setRewards(Integer rewards) { this.rewards = rewards; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public List<SubServiceDto> getSubServices() { return subServices; }
    public void setSubServices(List<SubServiceDto> subServices) { this.subServices = subServices; }
}
