package com.smartcampus.analytics;

import java.time.LocalDateTime;
import java.util.List;

public record FacilitiesAnalyticsResponse(
        int windowDays,
        LocalDateTime from,
        LocalDateTime to,
        List<TopResource> topResources,
        List<PeakHour> peakHours,
        List<ResourceUtilization> utilization
) {
    public record TopResource(Long resourceId, String name, long approvedBookings) {}
    public record PeakHour(int hour, long approvedBookings) {}
    public record ResourceUtilization(
            Long resourceId,
            String name,
            int availableMinutesPerDay,
            long bookedMinutes,
            double utilizationScore
    ) {}
}

