package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.domain.JoinRequest;
import com.meetup.domain.Plan;
import com.meetup.domain.Rating;
import com.meetup.repo.JoinRequestRepository;
import com.meetup.repo.PlanRepository;
import com.meetup.repo.RatingRepository;
import com.meetup.repo.UserRepository;
import com.meetup.web.ApiException;
import com.meetup.web.Dtos.RatingSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RatingService {

    private final RatingRepository ratings;
    private final PlanRepository plans;
    private final JoinRequestRepository requests;
    private final UserRepository users;

    public void rate(Long planId, Long raterId, Long rateeId, int stars, String comment) {
        if (raterId.equals(rateeId)) {
            throw ApiException.badRequest("You can't rate yourself");
        }
        Plan plan = plans.findWithHostById(planId).orElseThrow(() -> ApiException.notFound("Plan not found"));
        if (plan.getStartsAt().isAfter(Instant.now())) {
            throw ApiException.badRequest("You can rate once the plan has happened");
        }
        boolean raterIsHost = plan.getHost().getId().equals(raterId);
        boolean rateeIsHost = plan.getHost().getId().equals(rateeId);
        if (raterIsHost == rateeIsHost) {
            throw ApiException.badRequest("You can only rate the host or a guest from this plan");
        }
        Long guestId = raterIsHost ? rateeId : raterId;
        boolean wasGuest = requests.findByPlanIdAndUserId(planId, guestId)
                .filter(r -> r.getStatus() == JoinRequest.Status.ACCEPTED)
                .isPresent();
        if (!wasGuest) {
            throw ApiException.forbidden("That person wasn't part of this plan");
        }
        if (ratings.findByPlanIdAndRaterIdAndRateeId(planId, raterId, rateeId).isPresent()) {
            throw ApiException.conflict("You already rated this person for this plan");
        }
        AppUser rater = users.getReferenceById(raterId);
        AppUser ratee = users.findById(rateeId).orElseThrow(() -> ApiException.notFound("User not found"));
        ratings.save(new Rating(plan, rater, ratee, stars, comment == null ? null : comment.trim()));
    }

    @Transactional(readOnly = true)
    public RatingSummary summary(Long userId) {
        return new RatingSummary(ratings.averageFor(userId), ratings.countByRateeId(userId));
    }

    @Transactional(readOnly = true)
    public List<Long> ratedByMe(Long planId, Long raterId) {
        return ratings.findRateeIdsByPlanAndRater(planId, raterId);
    }
}
