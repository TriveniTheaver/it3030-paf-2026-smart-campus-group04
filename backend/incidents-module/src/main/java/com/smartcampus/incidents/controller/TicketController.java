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
import com.smartcampus.incidents.storage.TicketAttachmentStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Principal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

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

    @Autowired
    private TicketAttachmentStorageService ticketAttachmentStorage;

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /** Student / staff: submit maintenance tickets (JSON body, optional attachment URLs). */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createTicket(@RequestBody Ticket body, Principal principal) {
        try {
            User reporter = requireUser(principal);
            return ResponseEntity.ok(ticketService.createTicketForReporter(reporter, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Student / staff: submit with up to 3 image files (validated server-side: type, size, safe storage).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createTicketWithFiles(
            @RequestParam("resourceId") Long resourceId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "preferredContact", required = false) String preferredContact,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            Principal principal) {
        try {
            User reporter = requireUser(principal);
            List<String> uploaded = ticketAttachmentStorage.storeImages(
                    files == null ? List.of() : Arrays.asList(files));
            com.smartcampus.facilities.model.Resource resourceRef = new com.smartcampus.facilities.model.Resource();
            resourceRef.setId(resourceId);
            Ticket body = Ticket.builder()
                    .resource(resourceRef)
                    .category(category)
                    .priority(priority)
                    .description(description)
                    .preferredContact(preferredContact)
                    .attachments(uploaded)
                    .build();
            return ResponseEntity.ok(ticketService.createTicketForReporter(reporter, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Could not store attachment files");
        }
    }

    /** Serve uploaded evidence images (authenticated; filenames are opaque UUIDs). */
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getTicketFile(@PathVariable String filename, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        requireUser(principal);
        Path path = ticketAttachmentStorage.resolveExistingFile(filename);
        if (path == null) {
            return ResponseEntity.notFound().build();
        }
        Resource body = new FileSystemResource(path.toFile());
        String probe = null;
        try {
            probe = Files.probeContentType(path);
        } catch (IOException ignored) {
            // fall through
        }
        MediaType mediaType = MediaType.parseMediaType(
                Optional.ofNullable(probe).orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE));
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(body);
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

    @PutMapping("/{ticketId:\\d+}/comments/{commentId:\\d+}")
    public ResponseEntity<?> updateComment(@PathVariable Long ticketId,
                                           @PathVariable Long commentId,
                                           @RequestBody CommentRequest body,
                                           Principal principal) {
        try {
            User actor = requireUser(principal);
            String content = body != null ? body.content : null;
            return ResponseEntity.ok(ticketService.updateComment(ticketId, commentId, content, actor));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{ticketId:\\d+}/comments/{commentId:\\d+}")
    public ResponseEntity<?> deleteComment(@PathVariable Long ticketId,
                                           @PathVariable Long commentId,
                                           Principal principal) {
        try {
            User actor = requireUser(principal);
            ticketService.deleteComment(ticketId, commentId, actor);
            return ResponseEntity.noContent().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class CommentRequest {
        public String content;
    }
}
