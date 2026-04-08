package com.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

import com.smartcampus.core.model.Role;
import com.smartcampus.core.model.User;
import com.smartcampus.core.repository.UserRepository;

@SpringBootApplication
public class SmartCampusApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApplication.class, args);
    }

    @Bean
    public CommandLineRunner databaseSeeder(
        UserRepository userRepo,
        org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return _ -> {
            User admin = userRepo.findByEmail("admin@sliit.lk").orElse(new User());
            admin.setName("Admin User");
            admin.setEmail("admin@sliit.lk");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole(Role.ADMIN);
            userRepo.save(admin);
            
            User tech = userRepo.findByEmail("tech@sliit.lk").orElse(new User());
            tech.setName("Technician");
            tech.setEmail("tech@sliit.lk");
            tech.setPassword(passwordEncoder.encode("password123"));
            tech.setRole(Role.TECHNICIAN);
            userRepo.save(tech);

            User student = userRepo.findByEmail("it12345678@my.sliit.lk").orElse(new User());
            student.setName("Student IT12345678");
            student.setEmail("it12345678@my.sliit.lk");
            student.setPassword(passwordEncoder.encode("password123"));
            student.setRole(Role.USER);
            userRepo.save(student);
        };
    }
}
