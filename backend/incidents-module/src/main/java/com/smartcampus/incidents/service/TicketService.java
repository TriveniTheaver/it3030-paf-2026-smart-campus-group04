package com.smartcampus.incidents.service;

import com.smartcampus.core.model.Notification;
import com.smartcampus.core.repository.NotificationRepository;
import com.smartcampus.incidents.model.Comment;
import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import com.smartcampus.incidents.repository.CommentRepository;
import com.smartcampus.incidents.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Ticket updateTicketStatus(Long ticketId, TicketStatus newStatus, String resolutionNotes) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        ticket.setStatus(newStatus);
        
        if (resolutionNotes != null) {
            ticket.setResolutionNotes(resolutionNotes);
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        String notifMsg = String.format("Ticket #%d status updated to %s.", ticket.getId(), newStatus.name());
        notificationRepository.save(Notification.builder()
                .recipient(ticket.getReporter())
                .message(notifMsg)
                .build());

        return savedTicket;
    }

    @Transactional
    public Ticket assignTicket(Long ticketId, Long technicianId) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        com.smartcampus.core.model.User tech = com.smartcampus.core.repository.UserRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        
        ticket.setAssignee(tech);
        Ticket savedTicket = ticketRepository.save(ticket);

        notificationRepository.save(Notification.builder()
                .recipient(tech)
                .message(String.format("You have been assigned to Ticket #%d: %s", ticket.getId(), ticket.getResource().getName()))
                .build());

        return savedTicket;
    }

    @Transactional
    public Comment addComment(Comment comment) {
        Comment savedComment = commentRepository.save(comment);

        Ticket ticket = comment.getTicket();
        String notifMsg = String.format("New comment on Ticket #%d by %s.", ticket.getId(), comment.getAuthor().getName());

        if (comment.getAuthor().getId().equals(ticket.getReporter().getId()) && ticket.getAssignee() != null) {
            notificationRepository.save(Notification.builder().recipient(ticket.getAssignee()).message(notifMsg).build());
        } else if (!comment.getAuthor().getId().equals(ticket.getReporter().getId())) {
            notificationRepository.save(Notification.builder().recipient(ticket.getReporter()).message(notifMsg).build());
        }

        return savedComment;
    }
}
