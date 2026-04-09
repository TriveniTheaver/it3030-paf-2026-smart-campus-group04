package com.smartcampus.core.repository;

import com.smartcampus.core.model.Notification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @Modifying
    @Query("update Notification n set n.readStatus = true where n.recipient.id = :userId and n.readStatus = false")
    int markAllAsReadForUser(@Param("userId") Long userId);
}
