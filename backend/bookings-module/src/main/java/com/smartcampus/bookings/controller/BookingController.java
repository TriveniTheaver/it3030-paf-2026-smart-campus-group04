package com.smartcampus.bookings.controller;

import com.smartcampus.bookings.model.Booking;
import com.smartcampus.bookings.model.BookingStatus;
import com.smartcampus.bookings.repository.BookingRepository;
import com.smartcampus.bookings.service.BookingService;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @PostMapping
    // Student/staff accounts are represented as role USER in this system
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request, Principal principal) {
        try {
            Booking data = Booking.builder()
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .purpose(request.getPurpose())
                    .expectedAttendees(request.getExpectedAttendees())
                    .build();
            return ResponseEntity.ok(bookingService.createBooking(request.getResourceId(), principal.getName(), data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public List<Booking> getMyBookings(Principal principal) {
        return bookingService.getMyBookings(principal.getName());
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, Principal principal) {
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(id, principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Booking> getAllBookings(@RequestParam(required = false) BookingStatus status) {
        if (status != null) {
            return bookingRepository.findByStatus(status);
        }
        return bookingRepository.findAll();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestParam BookingStatus status,
                                          @RequestParam(required = false) String reason) {
        try {
            return ResponseEntity.ok(bookingService.updateBookingStatus(id, status, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingRequest {
        private Long resourceId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String purpose;
        private Integer expectedAttendees;
    }
}
