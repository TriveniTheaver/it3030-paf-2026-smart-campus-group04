package com.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

import com.smartcampus.core.model.Role;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.UserRepository;
import com.smartcampus.facilities.model.Resource;
import com.smartcampus.facilities.model.ResourceStatus;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.repository.ResourceRepository;
import com.smartcampus.bookings.model.Booking;
import com.smartcampus.bookings.model.BookingStatus;
import com.smartcampus.bookings.repository.BookingRepository;
import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import com.smartcampus.incidents.repository.TicketRepository;

import java.time.LocalDateTime;
import java.time.LocalTime;

@SpringBootApplication
public class SmartCampusApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApplication.class, args);
    }

    @Bean
    public CommandLineRunner databaseSeeder(
        UserRepository userRepo, 
        ResourceRepository resourceRepo,
        BookingRepository bookingRepo,
        TicketRepository ticketRepo,
        org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return _ -> {
            User admin = userRepo.findByEmail("admin@sliit.lk").orElse(new User());
            admin.setName("Admin User");
            admin.setEmail("admin@sliit.lk");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole(Role.ADMIN);
            admin = userRepo.save(admin);
            
            User tech = userRepo.findByEmail("tech@sliit.lk").orElse(new User());
            tech.setName("Technician");
            tech.setEmail("tech@sliit.lk");
            tech.setPassword(passwordEncoder.encode("password123"));
            tech.setRole(Role.TECHNICIAN);
            userRepo.save(tech);

            User student = userRepo.findByEmail("it12345678@my.sliit.lk").orElse(new User());
            student.setName("Student IT12345678");
            student.setEmail("it12345678@my.sliit.lk");
            student.setPassword(passwordEncoder.encode("password123"));
            student.setRole(Role.USER);
            userRepo.save(student);

            if (resourceRepo.count() == 0) {
                Resource r1 = Resource.builder()
                        .name("Main Auditorium (FOSS)")
                        .type(ResourceType.LECTURE_HALL)
                        .capacity(300)
                        .location("Block A, Level 1")
                        .availableFrom(LocalTime.of(8, 0))
                        .availableTo(LocalTime.of(20, 0))
                        .imageUrl("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200")
                        .status(ResourceStatus.ACTIVE)
                        .build();
                r1 = resourceRepo.save(r1);

                Resource r2 = Resource.builder()
                        .name("Strategic Computing Lab 4")
                        .type(ResourceType.LAB)
                        .capacity(40)
                        .location("Block B, Level 3")
                        .availableFrom(LocalTime.of(9, 0))
                        .availableTo(LocalTime.of(18, 0))
                        .imageUrl("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200")
                        .status(ResourceStatus.ACTIVE)
                        .build();
                r2 = resourceRepo.save(r2);

                Booking b = Booking.builder()
                        .user(admin)
                        .resource(r1)
                        .startTime(LocalDateTime.now().plusDays(2).withHour(10).withMinute(0))
                        .endTime(LocalDateTime.now().plusDays(2).withHour(12).withMinute(0))
                        .purpose("Strategic Planning Sync")
                        .expectedAttendees(50)
                        .status(BookingStatus.APPROVED)
                        .build();
                bookingRepo.save(b);

                Ticket t = Ticket.builder()
                        .reporter(admin)
                        .resource(r2)
                        .category("Hardware")
                        .priority("HIGH")
                        .status(TicketStatus.OPEN)
                        .description("Primary workstation GPU failure in Rack 2.")
                        .createdAt(LocalDateTime.now().minusHours(2))
                        .build();
                ticketRepo.save(t);

                Booking pendingBooking = Booking.builder()
                        .user(student)
                        .resource(r1)
                        .startTime(LocalDateTime.now().plusDays(3).withHour(14).withMinute(0))
                        .endTime(LocalDateTime.now().plusDays(3).withHour(16).withMinute(0))
                        .purpose("Group Project Discussion")
                        .expectedAttendees(5)
                        .status(BookingStatus.PENDING)
                        .build();
                bookingRepo.save(pendingBooking);

                Booking pendingBooking2 = Booking.builder()
                        .user(student)
                        .resource(r2)
                        .startTime(LocalDateTime.now().plusDays(4).withHour(9).withMinute(0))
                        .endTime(LocalDateTime.now().plusDays(4).withHour(11).withMinute(0))
                        .purpose("Software Testing Session")
                        .expectedAttendees(2)
                        .status(BookingStatus.PENDING)
                        .build();
                bookingRepo.save(pendingBooking2);
            }
        };
    }
}
