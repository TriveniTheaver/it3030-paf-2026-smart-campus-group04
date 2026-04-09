package com.smartcampus.incidents.service;

import com.smartcampus.core.model.Role;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.UserRepository;
import com.smartcampus.core.service.NotificationService;
import com.smartcampus.facilities.model.Resource;
import com.smartcampus.facilities.repository.ResourceRepository;
import com.smartcampus.incidents.model.Comment;
import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import com.smartcampus.incidents.repository.CommentRepository;
import com.smartcampus.incidents.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class TicketService {

    private static final Set<TicketStatus> TECHNICIAN_STATUS_CHANGES = EnumSet.of(
            TicketStatus.IN_PROGRESS,
            TicketStatus.RESOLVED,
            TicketStatus.CLOSED
    );

    private static final Set<TicketStatus> ADMIN_TRIAGE_STATUSES = EnumSet.of(
            TicketStatus.REJECTED,
            TicketStatus.CLOSED
    );

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    public boolean canAccessTicket(User viewer, Ticket ticket) {
        if (viewer == null || ticket == null) {
            return false;
        }
        if (viewer.getRole() == Role.ADMIN) {
            return true;
        }
        if (ticket.getReporter() != null && ticket.getReporter().getId().equals(viewer.getId())) {
            return true;
        }
        return ticket.getAssignee() != null && ticket.getAssignee().getId().equals(viewer.getId());
    }

    /**
     * Legacy helper: set reporter from JWT principal email (e.g. tests or alternate clients).
     */
    @Transactional
    public Ticket createTicket(Ticket ticket, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));
        ticket.setReporter(reporter);
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket createTicketForReporter(User reporter, Ticket body) {
        if (body.getResource() == null || body.getResource().getId() == null) {
            throw new IllegalArgumentException("A valid resource is required");
        }
        Resource resource = resourceRepository.findById(body.getResource().getId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        List<String> raw = body.getAttachments() != null ? body.getAttachments() : List.of();
        if (raw.size() > 3) {
            throw new IllegalArgumentException("At most 3 attachment URLs are allowed");
        }
        List<String> attachments = new ArrayList<>(raw);
        Ticket ticket = Ticket.builder()
                .resource(resource)
                .reporter(reporter)
                .category(body.getCategory() != null ? body.getCategory() : "General")
                .description(body.getDescription() != null ? body.getDescription() : "")
                .priority(body.getPriority() != null ? body.getPriority() : "LOW")
                .preferredContact(body.getPreferredContact())
                .attachments(attachments)
                .status(TicketStatus.OPEN)
                .build();
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket updateTicketStatus(Long ticketId, TicketStatus newStatus, String resolutionNotes, User actor) {
        System.out.println("[TicketService] updateTicketStatus called. ticketId=" + ticketId + ", newStatus=" + newStatus);
        Ticket ticket = ticketRepository.findByIdWithReporter(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        System.out.println("[TicketService] Loaded ticket id=" + ticket.getId() + ". reporter is "
                + (ticket.getReporter() == null ? "NULL" : "NOT NULL"));
        if (ticket.getReporter() != null) {
            System.out.println("[TicketService] Reporter id=" + ticket.getReporter().getId());
        }

        Role role = actor.getRole();

        if (role == Role.ADMIN) {
            if (!ADMIN_TRIAGE_STATUSES.contains(newStatus)) {
                throw new IllegalArgumentException(
                        "Administrators triage the queue: reject invalid tickets or close them administratively. "
                                + "Assign a technician to hand off in-progress and resolution work.");
            }
        } else if (role == Role.TECHNICIAN) {
            if (ticket.getAssignee() == null || !ticket.getAssignee().getId().equals(actor.getId())) {
                throw new IllegalArgumentException("Only the assigned technician can update this ticket's field status.");
            }
            if (!TECHNICIAN_STATUS_CHANGES.contains(newStatus)) {
                throw new IllegalArgumentException(
                        "Technicians may set In progress, Resolved, or Closed on tickets assigned to them.");
            }
        } else {
            throw new IllegalArgumentException("Not authorized to change ticket status");
        }

        ticket.setStatus(newStatus);
        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes);
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        String notifMsg = String.format("Your ticket #%d status has been updated to %s", ticket.getId(), newStatus.name());
        if (ticket.getReporter() != null) {
            notificationService.createNotification(ticket.getReporter().getId(), notifMsg);
            System.out.println("[TicketService] Notification sent to user: " + ticket.getReporter().getId());
        }

        return savedTicket;
    }

    @Transactional
    public Ticket assignTicket(Long ticketId, Long technicianId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        if (tech.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("Assignee must be a user with the technician role");
        }

        ticket.setAssignee(tech);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        Ticket savedTicket = ticketRepository.save(ticket);

        notificationService.createNotification(
                tech.getId(),
                String.format("You have been assigned to Ticket #%d: %s", ticket.getId(), ticket.getResource().getName())
        );

        if (ticket.getReporter() != null) {
            notificationService.createNotification(
                    ticket.getReporter().getId(),
                    String.format("Ticket #%d is now assigned to %s for resolution.", ticket.getId(), tech.getName())
            );
        }

        return savedTicket;
    }

    @Transactional
    public Comment addComment(Long ticketId, String content, User author) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Comment cannot be empty");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        if (!canAccessTicket(author, ticket)) {
            throw new IllegalArgumentException("You cannot comment on this ticket");
        }

        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content(content.trim())
                .build();
        Comment savedComment = commentRepository.save(comment);

        String commenterName = author.getName() != null ? author.getName() : "Unknown user";
        String reporterMsg = String.format("New comment added to your ticket #%d by %s", ticket.getId(), commenterName);
        String staffMsg = String.format("New comment on Ticket #%d by %s.", ticket.getId(), commenterName);

        if (ticket.getReporter() != null
                && !author.getId().equals(ticket.getReporter().getId())) {
            notificationService.createNotification(ticket.getReporter().getId(), reporterMsg);
        }

        if (ticket.getReporter() != null
                && author.getId().equals(ticket.getReporter().getId())
                && ticket.getAssignee() != null) {
            notificationService.createNotification(ticket.getAssignee().getId(), staffMsg);
        }

        return savedComment;
    }
}
