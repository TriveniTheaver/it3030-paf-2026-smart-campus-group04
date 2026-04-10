package com.smartcampus.core.controller;

import com.smartcampus.core.model.Notification;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.NotificationRepository;
import com.smartcampus.core.repository.UserRepository;
import com.smartcampus.core.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
        User user = requireUserFromAuth(authentication);
        return notificationService.getNotificationsForUser(user.getId()).stream()
                .map(NotificationDto::from)
                .toList();
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable("id") Long id, Authentication authentication) {
        if (authentication == null) {
            return;
        }
        User user = requireUserFromAuth(authentication);
        notificationService.markAsReadForRecipient(id, user.getId());
    }

    @PutMapping("/read-all")
    public void markAllAsRead(Authentication authentication) {
        if (authentication == null) return;
        User user = requireUserFromAuth(authentication);
        notificationService.markAllAsRead(user.getId());
    }

    @DeleteMapping("/mine")
    public void deleteAllMine(Authentication authentication) {
        if (authentication == null) return;
        User user = requireUserFromAuth(authentication);
        notificationService.deleteAllForUser(user.getId());
    }

    private User requireUserFromAuth(Authentication authentication) {
        String principal = authentication.getName();
        if (principal == null || principal.isBlank()) {
            throw new IllegalArgumentException("User not found");
        }
        return userRepository.findByEmailIgnoreCase(principal.trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
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

    /**
     * Send a notification to a single user (admin only). Message is stored as-is (not a campus-wide broadcast).
     * Prefer {@code recipientUserId} from the user directory so the message always targets the correct account.
     */
    @PostMapping("/personal")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendPersonalNotification(@RequestBody Map<String, Object> body) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        Object rawMsg = body.get("message");
        String message = rawMsg != null ? String.valueOf(rawMsg).trim() : "";
        if (message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }

        Long recipientUserId = parseLongOrNull(body.get("recipientUserId"));
        String recipientEmail = null;
        Object rawEmail = body.get("recipientEmail");
        if (rawEmail != null) {
            String e = String.valueOf(rawEmail).trim();
            recipientEmail = e.isEmpty() ? null : e;
        }

        User recipient;
        if (recipientUserId != null) {
            recipient = userRepository.findById(recipientUserId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No user with that id"));
        } else if (recipientEmail != null) {
            recipient = userRepository.findByEmailIgnoreCase(recipientEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No user registered with that email"));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide recipientUserId or recipientEmail");
        }
        notificationService.createNotification(recipient.getId(), message);
        return ResponseEntity.ok().build();
    }

    private static Long parseLongOrNull(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public record NotificationDto(
            Long id,
            String message,
            boolean readStatus,
            LocalDateTime createdAt,
            String recipientEmail,
            String recipientName
    ) {
        public static NotificationDto from(Notification n) {
            User r = n.getRecipient();
            return new NotificationDto(
                    n.getId(),
                    n.getMessage(),
                    n.isReadStatus(),
                    n.getCreatedAt(),
                    r != null ? r.getEmail() : null,
                    r != null ? r.getName() : null
            );
        }
    }
}

