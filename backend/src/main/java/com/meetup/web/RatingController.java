package com.meetup.web;

import com.meetup.service.RatingService;
import com.meetup.web.Dtos.RateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plans/{planId}/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratings;

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void rate(@PathVariable Long planId, @Valid @RequestBody RateRequest req, @AuthenticationPrincipal Jwt jwt) {
        ratings.rate(planId, userId(jwt), req.rateeId(), req.stars(), req.comment());
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
