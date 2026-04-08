package com.smartcampus.facilities.dto;

import com.smartcampus.facilities.model.ResourceStatus;
import com.smartcampus.facilities.model.ResourceType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be at most 255 characters")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 100_000, message = "Capacity is too large")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(max = 500, message = "Location must be at most 500 characters")
    private String location;

    private LocalTime availableFrom;
    private LocalTime availableTo;

    @Size(max = 1000, message = "Image URL must be at most 1000 characters")
    private String imageUrl;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    @AssertTrue(message = "Set both start and end times for availability, or clear both for unrestricted access")
    public boolean isAvailabilityWindowValid() {
        if (availableFrom == null && availableTo == null) {
            return true;
        }
        if (availableFrom == null || availableTo == null) {
            return false;
        }
        return !availableTo.isBefore(availableFrom);
    }
}
