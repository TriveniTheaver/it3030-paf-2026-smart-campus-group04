package com.smartcampus.incidents.repository;

import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReporterId(Long reporterId);
    List<Ticket> findByAssigneeId(Long assigneeId);
    List<Ticket> findByStatus(TicketStatus status);
}
