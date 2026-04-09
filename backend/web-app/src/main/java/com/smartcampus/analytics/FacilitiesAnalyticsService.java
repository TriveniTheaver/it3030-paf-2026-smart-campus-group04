package com.smartcampus.analytics;

import com.smartcampus.bookings.model.Booking;
import com.smartcampus.bookings.model.BookingStatus;
import com.smartcampus.bookings.repository.BookingRepository;
import com.smartcampus.facilities.model.Resource;
import com.smartcampus.facilities.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class FacilitiesAnalyticsService {
    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public FacilitiesAnalyticsService(BookingRepository bookingRepository, ResourceRepository resourceRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
    }

    public FacilitiesAnalyticsResponse build(int windowDays, LocalDateTime now) {
        int days = Math.max(1, Math.min(365, windowDays));
        // Admins care about both historical and upcoming approvals.
        // For charts that need a time axis, use a symmetric window around "now".
        LocalDateTime from = now.minusDays(days);
        LocalDateTime to = now.plusDays(days);

        List<FacilitiesAnalyticsResponse.TopResource> topResources = bookingRepository
                .topResourcesByApprovedBookingsAllTime()
                .stream()
                .limit(8)
                .map(r -> new FacilitiesAnalyticsResponse.TopResource(r.getResourceId(), r.getResourceName(), r.getBookingCount()))
                .toList();

        long[] hourCounts = new long[24];
        for (BookingRepository.HourCountRow row : bookingRepository.peakHoursByApprovedBookingsAllTime()) {
            Integer hour = row.getHour();
            if (hour != null && hour >= 0 && hour <= 23) {
                hourCounts[hour] = row.getBookingCount() == null ? 0 : row.getBookingCount();
            }
        }
        List<FacilitiesAnalyticsResponse.PeakHour> peakHours = new ArrayList<>(24);
        for (int h = 0; h < 24; h++) {
            peakHours.add(new FacilitiesAnalyticsResponse.PeakHour(h, hourCounts[h]));
        }

        // Novelty: utilization score combines booked minutes vs. resource daily availability window.
        List<Resource> resources = resourceRepository.findAll();
        List<Booking> approvedBookings = bookingRepository.findApprovedStartingBetween(from, to);

        Map<Long, Long> bookedMinutesByResource = new HashMap<>();
        for (Booking b : approvedBookings) {
            Long rid = b.getResource() != null ? b.getResource().getId() : null;
            if (rid == null) continue;
            long minutes = Duration.between(b.getStartTime(), b.getEndTime()).toMinutes();
            if (minutes < 0) minutes = 0;
            bookedMinutesByResource.merge(rid, minutes, Long::sum);
        }

        List<FacilitiesAnalyticsResponse.ResourceUtilization> utilization = new ArrayList<>();
        for (Resource r : resources) {
            Long rid = r.getId();
            if (rid == null) continue;
            int availableMins = availableMinutesPerDay(r.getAvailableFrom(), r.getAvailableTo());
            long booked = bookedMinutesByResource.getOrDefault(rid, 0L);
            // Use the chart window length (past+future) for utilization to keep it consistent with bookedMinutesByResource.
            double denom = (double) availableMins * (double) (days * 2);
            double score = denom <= 0 ? 0.0 : Math.min(1.0, Math.max(0.0, booked / denom));
            utilization.add(new FacilitiesAnalyticsResponse.ResourceUtilization(
                    rid,
                    r.getName(),
                    availableMins,
                    booked,
                    round3(score)
            ));
        }
        utilization.sort((a, b) -> Double.compare(b.utilizationScore(), a.utilizationScore()));
        if (utilization.size() > 12) {
            utilization = utilization.subList(0, 12);
        }

        FacilitiesAnalyticsResponse.Summary summary = new FacilitiesAnalyticsResponse.Summary(
                bookingRepository.countByStatus(BookingStatus.APPROVED),
                bookingRepository.countByStatus(BookingStatus.PENDING),
                bookingRepository.countByStatus(BookingStatus.REJECTED),
                bookingRepository.countByStatus(BookingStatus.CANCELLED)
        );

        // New: "most booked resources over time" (approved) for top 3 resources, within the symmetric chart window.
        List<FacilitiesAnalyticsResponse.ResourceDailySeries> series = new ArrayList<>();
        List<BookingRepository.ResourceBookingCountRow> top3 = bookingRepository.topResourcesByApprovedBookingsAllTime()
                .stream()
                .limit(3)
                .toList();

        // Create a complete day axis so the frontend can render a clean chart.
        Map<LocalDate, Map<Long, Long>> countsByDayByResource = new TreeMap<>();
        LocalDate startDay = from.toLocalDate();
        LocalDate endDay = to.toLocalDate();
        for (LocalDate d = startDay; !d.isAfter(endDay); d = d.plusDays(1)) {
            countsByDayByResource.put(d, new HashMap<>());
        }

        if (!top3.isEmpty()) {
            List<Long> topIds = top3.stream().map(BookingRepository.ResourceBookingCountRow::getResourceId).toList();
            for (Booking b : approvedBookings) {
                Long rid = b.getResource() != null ? b.getResource().getId() : null;
                if (rid == null || !topIds.contains(rid)) continue;
                LocalDate day = b.getStartTime().toLocalDate();
                Map<Long, Long> per = countsByDayByResource.get(day);
                if (per == null) continue;
                per.merge(rid, 1L, Long::sum);
            }

            for (BookingRepository.ResourceBookingCountRow r : top3) {
                Long rid = r.getResourceId();
                List<FacilitiesAnalyticsResponse.DailyCount> points = new ArrayList<>();
                for (Map.Entry<LocalDate, Map<Long, Long>> e : countsByDayByResource.entrySet()) {
                    long c = e.getValue().getOrDefault(rid, 0L);
                    points.add(new FacilitiesAnalyticsResponse.DailyCount(e.getKey().toString(), c));
                }
                series.add(new FacilitiesAnalyticsResponse.ResourceDailySeries(rid, r.getResourceName(), points));
            }
        }

        return new FacilitiesAnalyticsResponse(days, from, to, summary, topResources, peakHours, series, utilization);
    }

    private static int availableMinutesPerDay(LocalTime from, LocalTime to) {
        if (from == null || to == null) return 24 * 60;
        int start = from.getHour() * 60 + from.getMinute();
        int end = to.getHour() * 60 + to.getMinute();
        if (end < start) return 24 * 60;
        return Math.max(0, end - start);
    }

    private static double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}

