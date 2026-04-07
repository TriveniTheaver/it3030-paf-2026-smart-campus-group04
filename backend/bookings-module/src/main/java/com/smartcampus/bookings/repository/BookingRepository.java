package com.smartcampus.bookings.repository;

import com.smartcampus.bookings.model.Booking;
import com.smartcampus.bookings.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatus(BookingStatus status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    long countOverlappingBookings(@Param("resourceId") Long resourceId,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.id <> :excludeId " +
           "AND b.status = 'APPROVED' " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    long countApprovedOverlapsExcludingId(@Param("resourceId") Long resourceId,
                                         @Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime,
                                         @Param("excludeId") Long excludeId);
}
