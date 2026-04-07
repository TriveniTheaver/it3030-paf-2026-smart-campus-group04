package com.smartcampus.facilities.controller;

import com.smartcampus.facilities.model.Resource;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
public class ResourceController {

    @Autowired
    private ResourceRepository resourceRepository;

    @GetMapping
    public List<Resource> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        return resourceRepository.searchResources(type, minCapacity, location);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        return resourceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        Resource savedResource = resourceRepository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResource);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> updateResource(@PathVariable Long id, @RequestBody Resource resourceDetails) {
        return resourceRepository.findById(id).map(resource -> {
            resource.setName(resourceDetails.getName());
            resource.setType(resourceDetails.getType());
            resource.setCapacity(resourceDetails.getCapacity());
            resource.setLocation(resourceDetails.getLocation());
            resource.setAvailableFrom(resourceDetails.getAvailableFrom());
            resource.setAvailableTo(resourceDetails.getAvailableTo());
            resource.setImageUrl(resourceDetails.getImageUrl());
            resource.setStatus(resourceDetails.getStatus());
            return ResponseEntity.ok(resourceRepository.save(resource));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        return resourceRepository.findById(id).map(resource -> {
            resourceRepository.delete(resource);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
