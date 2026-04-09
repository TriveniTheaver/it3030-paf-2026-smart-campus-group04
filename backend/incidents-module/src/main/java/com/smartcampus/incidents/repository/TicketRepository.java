package com.smartcampus.incidents.repository;

import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReporterId(Long reporterId);
    List<Ticket> findByAssigneeId(Long assigneeId);
    List<Ticket> findByStatus(TicketStatus status);

    @Query("select t from Ticket t join fetch t.reporter where t.id = :id")
    Optional<Ticket> findByIdWithReporter(@Param("id") Long id);
}
