package com.smartcampus.core.controller;

import com.smartcampus.core.model.Role;

/** Safe JSON view of a user (no password or security fields). */
public record UserSummaryDto(Long id, String email, String name, Role role) {}
