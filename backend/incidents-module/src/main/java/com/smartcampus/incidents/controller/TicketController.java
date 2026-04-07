package com.smartcampus.incidents.controller;

import com.smartcampus.incidents.model.Comment;
import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import com.smartcampus.incidents.repository.CommentRepository;
import com.smartcampus.incidents.repository.TicketRepository;
import com.smartcampus.incidents.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TicketService ticketService;

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        if (ticket.getAttachments() != null && ticket.getAttachments().size() > 3) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    @GetMapping("/user/{reporterId}")
    public List<Ticket> getTicketsByUser(@PathVariable Long reporterId) {
        return ticketRepository.findByReporterId(reporterId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, 
                                          @RequestParam TicketStatus status,
                                          @RequestParam(required = false) String resolutionNotes) {
        try {
            return ResponseEntity.ok(ticketService.updateTicketStatus(id, status, resolutionNotes));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/assign")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTicket(@PathVariable Long id, @RequestParam Long technicianId) {
        try {
            return ResponseEntity.ok(ticketService.assignTicket(id, technicianId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{ticketId}/comments")
    public List<Comment> getComments(@PathVariable Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long ticketId, @RequestBody Comment comment) {
        Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null) return ResponseEntity.notFound().build();
        comment.setTicket(ticket);
        return ResponseEntity.ok(ticketService.addComment(comment));
    }
}
