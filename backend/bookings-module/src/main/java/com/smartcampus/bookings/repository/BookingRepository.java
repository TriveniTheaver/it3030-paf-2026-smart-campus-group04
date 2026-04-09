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
    long countByStatus(BookingStatus status);

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.status = 'APPROVED'
              AND b.startTime >= :from
              AND b.startTime < :to
            """)
    List<Booking> findApprovedStartingBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    interface ResourceBookingCountRow {
        Long getResourceId();
        String getResourceName();
        Long getBookingCount();
    }

    @Query("""
            SELECT b.resource.id as resourceId,
                   b.resource.name as resourceName,
                   COUNT(b) as bookingCount
            FROM Booking b
            WHERE b.status = 'APPROVED'
              AND b.startTime >= :from
              AND b.startTime < :to
            GROUP BY b.resource.id, b.resource.name
            ORDER BY COUNT(b) DESC
            """)
    List<ResourceBookingCountRow> topResourcesByApprovedBookings(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT b.resource.id as resourceId,
                   b.resource.name as resourceName,
                   COUNT(b) as bookingCount
            FROM Booking b
            WHERE b.status = 'APPROVED'
            GROUP BY b.resource.id, b.resource.name
            ORDER BY COUNT(b) DESC
            """)
    List<ResourceBookingCountRow> topResourcesByApprovedBookingsAllTime();

    interface HourCountRow {
        Integer getHour();
        Long getBookingCount();
    }

    @Query("""
            SELECT function('hour', b.startTime) as hour,
                   COUNT(b) as bookingCount
            FROM Booking b
            WHERE b.status = 'APPROVED'
              AND b.startTime >= :from
              AND b.startTime < :to
            GROUP BY function('hour', b.startTime)
            ORDER BY function('hour', b.startTime) ASC
            """)
    List<HourCountRow> peakHoursByApprovedBookings(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT function('hour', b.startTime) as hour,
                   COUNT(b) as bookingCount
            FROM Booking b
            WHERE b.status = 'APPROVED'
            GROUP BY function('hour', b.startTime)
            ORDER BY function('hour', b.startTime) ASC
            """)
    List<HourCountRow> peakHoursByApprovedBookingsAllTime();

    @Query("""
            SELECT COUNT(b)
            FROM Booking b
            WHERE b.status = :status
              AND b.startTime >= :from
              AND b.startTime < :to
            """)
    long countByStatusStartingBetween(@Param("status") BookingStatus status,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);
    
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
