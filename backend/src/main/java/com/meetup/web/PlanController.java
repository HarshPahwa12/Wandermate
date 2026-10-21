package com.meetup.web;

import com.meetup.domain.Plan;
import com.meetup.service.PlanService;
import com.meetup.web.Dtos.AttendanceRequest;
import com.meetup.web.Dtos.CreatePlanRequest;
import com.meetup.web.Dtos.PlanView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService service;

    @GetMapping("/plans")
    List<PlanView> list(@RequestParam(required = false) Double lat,
                        @RequestParam(required = false) Double lng,
                        @RequestParam(defaultValue = "10") double radiusKm,
                        @RequestParam(required = false) Plan.Category category,
                        @RequestParam(required = false) String q,
                        @RequestParam(required = false) Instant from,
                        @RequestParam(required = false) Instant to,
                        @AuthenticationPrincipal Jwt jwt) {
        if (radiusKm <= 0 || radiusKm > 200) {
            throw ApiException.badRequest("radiusKm must be between 0 and 200");
        }
        return service.list(lat, lng, radiusKm, category, q, from, to, userId(jwt));
    }

    @GetMapping("/plans/mine")
    List<PlanView> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.listMine(userId(jwt));
    }

    @GetMapping("/plans/{id}")
    PlanView get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.get(id, userId(jwt));
    }

    @PostMapping("/plans")
    @ResponseStatus(HttpStatus.CREATED)
    PlanView create(@Valid @RequestBody CreatePlanRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.create(userId(jwt), req);
    }

    @PutMapping("/plans/{id}")
    PlanView update(@PathVariable Long id, @Valid @RequestBody CreatePlanRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.update(id, userId(jwt), req);
    }

    @PostMapping("/plans/{id}/join")
    @ResponseStatus(HttpStatus.CREATED)
    void join(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.join(id, userId(jwt));
    }

    @DeleteMapping("/plans/{id}/join")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void cancelJoin(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.cancelJoin(id, userId(jwt));
    }

    @PostMapping("/requests/{id}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void accept(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.decide(id, userId(jwt), true);
    }

    @PostMapping("/requests/{id}/decline")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void decline(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.decide(id, userId(jwt), false);
    }

    @PutMapping("/requests/{id}/attendance")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void attendance(@PathVariable Long id, @Valid @RequestBody AttendanceRequest req, @AuthenticationPrincipal Jwt jwt) {
        service.markAttendance(id, userId(jwt), req.attended());
    }

    private static Long userId(Jwt jwt) {
        return jwt == null ? null : Long.valueOf(jwt.getSubject());
    }
}
