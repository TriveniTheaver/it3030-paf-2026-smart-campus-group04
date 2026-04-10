package com.smartcampus.core.controller;

import com.smartcampus.core.model.Role;
import com.smartcampus.core.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserSummaryDto> listUsersForAdmin() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getEmail(), u.getName(), u.getRole()))
                .sorted(Comparator.comparing(UserSummaryDto::email, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @GetMapping("/technicians")
    public List<UserSummaryDto> getTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN).stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getEmail(), u.getName(), u.getRole()))
                .sorted(Comparator.comparing(UserSummaryDto::email, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }
}
