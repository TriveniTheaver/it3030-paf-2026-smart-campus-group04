package com.smartcampus.analytics;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/facilities/analytics")
public class FacilitiesAnalyticsController {
    private final FacilitiesAnalyticsService analyticsService;

    public FacilitiesAnalyticsController(FacilitiesAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilitiesAnalyticsResponse> get(@RequestParam(defaultValue = "30") int days) {
        LocalDateTime now = LocalDateTime.now();
        return ResponseEntity.ok(analyticsService.build(days, now));
    }
}

