package com.smartcampus.analytics;

import java.time.LocalDateTime;
import java.util.List;

public record FacilitiesAnalyticsResponse(
        int windowDays,
        LocalDateTime from,
        LocalDateTime to,
        Summary summary,
        List<TopResource> topResources,
        List<PeakHour> peakHours,
        List<ResourceDailySeries> topResourcesDailySeries,
        List<ResourceUtilization> utilization
) {
    public record Summary(
            long approvedTotal,
            long pendingTotal,
            long rejectedTotal,
            long cancelledTotal
    ) {}
    public record TopResource(Long resourceId, String name, long approvedBookings) {}
    public record PeakHour(int hour, long approvedBookings) {}
    public record ResourceDailySeries(Long resourceId, String name, List<DailyCount> points) {}
    public record DailyCount(String day, long approvedBookings) {}
    public record ResourceUtilization(
            Long resourceId,
            String name,
            int availableMinutesPerDay,
            long bookedMinutes,
            double utilizationScore
    ) {}
}

