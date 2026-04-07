package com.smartcampus.core.controller;

import com.smartcampus.core.model.Notification;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.NotificationRepository;
import com.smartcampus.core.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public NotificationController() {
    }

    @GetMapping
    public List<Notification> getMyNotifications(Principal principal) {
        if (principal == null) return List.of();
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable("id") Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setReadStatus(true);
            notificationRepository.save(n);
        });
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable("id") Long id) {
        notificationRepository.deleteById(id);
    }

    @GetMapping("/admin/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @PostMapping("/broadcast")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void broadcastNotification(@RequestParam String message) {
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            notificationRepository.save(Notification.builder()
                    .recipient(user)
                    .message("[SYSTEM BROADCAST] " + message)
                    .readStatus(false)
                    .build());
        }
    }
}
