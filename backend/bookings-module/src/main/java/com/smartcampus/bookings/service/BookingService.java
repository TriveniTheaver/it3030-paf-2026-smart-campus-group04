package com.smartcampus.bookings.service;

import com.smartcampus.bookings.model.Booking;
import com.smartcampus.bookings.model.BookingStatus;
import com.smartcampus.bookings.repository.BookingRepository;
import com.smartcampus.core.model.Notification;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.NotificationRepository;
import com.smartcampus.core.repository.UserRepository;
import com.smartcampus.facilities.model.Resource;
import com.smartcampus.facilities.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Booking createBooking(Long resourceId, String userEmail, Booking bookingData) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 1. Availability Window Check
        LocalTime requestedStart = bookingData.getStartTime().toLocalTime();
        LocalTime requestedEnd = bookingData.getEndTime().toLocalTime();

        if (resource.getAvailableFrom() != null && requestedStart.isBefore(resource.getAvailableFrom())) {
            throw new IllegalArgumentException("Operational Window Error: This facility only opens at " + resource.getAvailableFrom());
        }
        if (resource.getAvailableTo() != null && requestedEnd.isAfter(resource.getAvailableTo())) {
            throw new IllegalArgumentException("Operational Window Error: This facility closes at " + resource.getAvailableTo());
        }

        // 2. Conflict Check (includes PENDING and APPROVED)
        long overlaps = bookingRepository.countOverlappingBookings(
                resourceId, 
                bookingData.getStartTime(), 
                bookingData.getEndTime()
        );

        if (overlaps > 0) {
            throw new IllegalArgumentException("Schedule Conflict: Resource is already requested or booked for this time period.");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .startTime(bookingData.getStartTime())
                .endTime(bookingData.getEndTime())
                .purpose(bookingData.getPurpose())
                .expectedAttendees(bookingData.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);

        // Notify user about pending request
        Notification notif = Notification.builder()
                .recipient(user)
                .message("Review Pending: Your request for " + resource.getName() + " has been submitted.")
                .readStatus(false)
                .build();
        notificationRepository.save(notif);

        return saved;
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new IllegalArgumentException("Unauthorized access to this booking.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateBookingStatus(Long bookingId, BookingStatus newStatus, String adminReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        if (newStatus == BookingStatus.APPROVED) {
            long approvedOverlaps = bookingRepository.countApprovedOverlapsExcludingId(
                booking.getResource().getId(), 
                booking.getStartTime(), 
                booking.getEndTime(),
                bookingId
            );
            if (approvedOverlaps > 0) {
                throw new IllegalStateException("Strict Conflict: This resource was already approved for another user during this time slot.");
            }
        }
        
        booking.setStatus(newStatus);
        if (adminReason != null) {
            booking.setAdminReason(adminReason);
        }

        Booking saved = bookingRepository.save(booking);

        String message = String.format("Your booking for %s is now %s.", booking.getResource().getName(), newStatus.name());
        Notification notif = Notification.builder()
                .recipient(booking.getUser())
                .message(message)
                .readStatus(false)
                .build();
        notificationRepository.save(notif);

        return saved;
    }

    public List<Booking> getMyBookings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return bookingRepository.findByUserId(user.getId());
    }
}
