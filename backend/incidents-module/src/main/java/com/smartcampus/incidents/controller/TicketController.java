package com.smartcampus.incidents.controller;

import com.smartcampus.core.model.Role;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.UserRepository;
import com.smartcampus.incidents.model.Comment;
import com.smartcampus.incidents.model.Ticket;
import com.smartcampus.incidents.model.TicketStatus;
import com.smartcampus.incidents.repository.CommentRepository;
import com.smartcampus.incidents.repository.TicketRepository;
import com.smartcampus.incidents.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
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

    @Autowired
    private UserRepository userRepository;

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /** Student / staff: submit maintenance tickets */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createTicket(@RequestBody Ticket body, Principal principal) {
        try {
            User reporter = requireUser(principal);
            return ResponseEntity.ok(ticketService.createTicketForReporter(reporter, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Administrator: full queue for triage and assignment */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Ticket> listAllForAdmin() {
        return ticketRepository.findAll();
    }

    /** Technician: jobs assigned to them only */
    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public List<Ticket> listAssignedToMe(Principal principal) {
        User tech = requireUser(principal);
        return ticketRepository.findByAssigneeId(tech.getId());
    }

    /** Student / staff: tickets they reported */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('USER')")
    public List<Ticket> listMine(Principal principal) {
        User u = requireUser(principal);
        return ticketRepository.findByReporterId(u.getId());
    }

    @GetMapping("/user/{reporterId}")
    public ResponseEntity<?> listByReporter(@PathVariable Long reporterId, Principal principal) {
        User u = requireUser(principal);
        if (u.getRole() != Role.ADMIN && !u.getId().equals(reporterId)) {
            return ResponseEntity.status(403).body("Forbidden");
        }
        return ResponseEntity.ok(ticketRepository.findByReporterId(reporterId));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<?> getTicketById(@PathVariable Long id, Principal principal) {
        User u = requireUser(principal);
        return ticketRepository.findById(id)
                .map(t -> ticketService.canAccessTicket(u, t) ? ResponseEntity.ok(t) : ResponseEntity.status(403).build())
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id:\\d+}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestParam TicketStatus status,
                                          @RequestParam(required = false) String resolutionNotes,
                                          Principal principal) {
        try {
            User actor = requireUser(principal);
            return ResponseEntity.ok(ticketService.updateTicketStatus(id, status, resolutionNotes, actor));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id:\\d+}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTicket(@PathVariable Long id, @RequestParam Long technicianId) {
        try {
            return ResponseEntity.ok(ticketService.assignTicket(id, technicianId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{ticketId:\\d+}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long ticketId, Principal principal) {
        User u = requireUser(principal);
        Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }
        if (!ticketService.canAccessTicket(u, ticket)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId));
    }

    @PostMapping("/{ticketId:\\d+}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long ticketId,
                                        @RequestBody CommentRequest body,
                                        Principal principal) {
        try {
            User author = requireUser(principal);
            String content = body != null ? body.content : null;
            return ResponseEntity.ok(ticketService.addComment(ticketId, content, author));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class CommentRequest {
        public String content;
    }
}
