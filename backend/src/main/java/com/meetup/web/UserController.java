package com.meetup.web;

import com.meetup.domain.AppUser;
import com.meetup.repo.UserRepository;
import com.meetup.service.BlockService;
import com.meetup.service.RatingService;
import com.meetup.service.ReportService;
import com.meetup.web.Dtos.MeView;
import com.meetup.web.Dtos.RatingSummary;
import com.meetup.web.Dtos.ReportRequest;
import com.meetup.web.Dtos.UserView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository users;
    private final BlockService blocks;
    private final ReportService reportService;
    private final RatingService ratingService;

    @GetMapping("/me")
    MeView me(@AuthenticationPrincipal Jwt jwt) {
        AppUser user = users.findById(userId(jwt)).orElseThrow(() -> ApiException.notFound("User not found"));
        return new MeView(user.getId(), user.getEmail(), user.getDisplayName());
    }

    @GetMapping("/blocked")
    List<UserView> blocked(@AuthenticationPrincipal Jwt jwt) {
        return blocks.listBlocked(userId(jwt));
    }

    @PostMapping("/{id}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void block(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        blocks.block(userId(jwt), id);
    }

    @DeleteMapping("/{id}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void unblock(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        blocks.unblock(userId(jwt), id);
    }

    @PostMapping("/{id}/report")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void report(@PathVariable Long id, @Valid @RequestBody ReportRequest req, @AuthenticationPrincipal Jwt jwt) {
        reportService.report(userId(jwt), id, req.planId(), req.reason());
    }

    @GetMapping("/{id}/rating-summary")
    RatingSummary ratingSummary(@PathVariable Long id) {
        return ratingService.summary(id);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
