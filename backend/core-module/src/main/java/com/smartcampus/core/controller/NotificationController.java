package com.smartcampus.core.controller;

import com.smartcampus.core.model.Notification;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.NotificationRepository;
import com.smartcampus.core.repository.UserRepository;
import com.smartcampus.core.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository,
            NotificationRepository notificationRepository
    ) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<NotificationDto> getMyNotifications(Authentication authentication) {
        if (authentication == null) return List.of();
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationService.getNotificationsForUser(user.getId()).stream()
                .map(NotificationDto::from)
                .toList();
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable("id") Long id) {
        notificationService.markAsRead(id);
    }

    @PutMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        if (authentication == null) return;
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        notificationService.markAllAsRead(user.getId());
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable("id") Long id) {
        notificationRepository.deleteById(id);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<NotificationDto> getAllNotifications() {
        return notificationRepository.findAll().stream().map(NotificationDto::from).toList();
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public void broadcastNotification(@RequestParam String message) {
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            notificationService.createNotification(user.getId(), "[SYSTEM BROADCAST] " + message);
        }
    }

    public record NotificationDto(Long id, String message, boolean readStatus, LocalDateTime createdAt) {
        public static NotificationDto from(Notification n) {
            return new NotificationDto(n.getId(), n.getMessage(), n.isReadStatus(), n.getCreatedAt());
        }
    }
}

