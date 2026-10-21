package com.meetup.web;

import com.meetup.domain.JoinRequest;
import com.meetup.domain.Plan;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

public final class Dtos {

    private Dtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 40) String displayName) {
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {
    }

    public record GoogleLoginRequest(@NotBlank String idToken) {
    }

    public record ForgotPasswordRequest(@NotBlank @Email String email) {
    }

    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) String newPassword) {
    }

    public record AuthResponse(String token, UserView user) {
    }

    public record UserView(Long id, String displayName) {
    }

    public record MeView(Long id, String email, String displayName) {
    }

    public record CreatePlanRequest(
            @NotBlank @Size(max = 100) String title,
            @Size(max = 1000) String description,
            @NotNull Plan.Category category,
            @NotBlank @Size(max = 120) String placeName,
            @NotBlank @Size(max = 60) String areaName,
            @DecimalMin("-90") @DecimalMax("90") double lat,
            @DecimalMin("-180") @DecimalMax("180") double lng,
            @NotNull @Future Instant startsAt,
            @Min(1) @Max(20) int capacity) {
    }

    /** What a host sees about a requester before deciding: reputation and follow-through. */
    public record TrustView(Double ratingAverage, long ratingCount, long meetupsAttended, long noShows,
                            Instant memberSince) {
    }

    public record RequestView(Long id, UserView user, JoinRequest.Status status, boolean blocked, TrustView trust,
                              Boolean attended) {
    }

    public record AttendanceRequest(@NotNull Boolean attended) {
    }

    public record ReportRequest(@NotBlank @Size(max = 500) String reason, Long planId) {
    }

    public record RateRequest(@NotNull Long rateeId, @Min(1) @Max(5) int stars, @Size(max = 500) String comment) {
    }

    public record RatingSummary(Double average, long count) {
    }

    /**
     * One shape for both the feed and the detail page.
     * {@code description}, {@code myStatus} and {@code requests} are only filled on the detail endpoint.
     * Unless {@code locationExact}, {@code placeName} is the public area label and {@code lat}/{@code lng}
     * are rounded to roughly 1 km; the exact spot is shared with the host and accepted guests only.
     */
    public record PlanView(
            Long id,
            String title,
            String description,
            Plan.Category category,
            String placeName,
            double lat,
            double lng,
            Instant startsAt,
            int capacity,
            int spotsLeft,
            UserView host,
            Double distanceKm,
            boolean isHost,
            JoinRequest.Status myStatus,
            List<RequestView> requests,
            List<Long> ratedUserIds,
            String areaName,
            boolean locationExact) {
    }
}
