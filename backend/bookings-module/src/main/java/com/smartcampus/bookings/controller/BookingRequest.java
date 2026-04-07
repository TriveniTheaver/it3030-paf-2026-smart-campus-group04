package com.smartcampus.bookings.controller;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingRequest {
    private Long resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer expectedAttendees;
}
