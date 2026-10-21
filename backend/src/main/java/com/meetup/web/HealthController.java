package com.meetup.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Liveness check for the hosting platform. Deliberately skips the database so a slow query can't fail the check. */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
