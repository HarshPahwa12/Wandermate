package com.meetup;

import com.meetup.domain.AppUser;
import com.meetup.domain.JoinRequest;
import com.meetup.domain.Plan;
import com.meetup.domain.Rating;
import com.meetup.repo.JoinRequestRepository;
import com.meetup.repo.PlanRepository;
import com.meetup.repo.RatingRepository;
import com.meetup.repo.UserRepository;
import com.meetup.service.PlanService;
import com.meetup.service.TrustService;
import com.meetup.web.ApiException;
import com.meetup.web.Dtos.TrustView;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:trust;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE")
@ActiveProfiles("h2")
class TrustServiceTests {

    @Autowired UserRepository users;
    @Autowired PlanRepository plans;
    @Autowired JoinRequestRepository requests;
    @Autowired RatingRepository ratings;
    @Autowired TrustService trust;
    @Autowired PlanService planService;

    @Test
    void trustReflectsAttendanceNoShowsAndRatings() {
        AppUser host = users.save(new AppUser("trust-host@t.io", "x", "Host"));
        AppUser guest = users.save(new AppUser("trust-guest@t.io", "x", "Guest"));
        JoinRequest attendedUnmarked = accepted(host, guest, Instant.now().minus(Duration.ofDays(3)));
        JoinRequest noShow = accepted(host, guest, Instant.now().minus(Duration.ofDays(2)));
        JoinRequest futurePlan = accepted(host, guest, Instant.now().plus(Duration.ofDays(2)));
        ratings.save(new Rating(attendedUnmarked.getPlan(), host, guest, 4, null));
        ratings.save(new Rating(noShow.getPlan(), host, guest, 2, null));

        planService.markAttendance(noShow.getId(), host.getId(), false);

        TrustView t = trust.forUsers(List.of(guest)).get(guest.getId());
        assertEquals(1, t.meetupsAttended(), "unmarked past plan counts; no-show and future plan don't");
        assertEquals(1, t.noShows());
        assertEquals(3.0, t.ratingAverage(), 0.001);
        assertEquals(2, t.ratingCount());

        // Undoing the mark puts the meetup back in the attended count.
        planService.markAttendance(noShow.getId(), host.getId(), true);
        t = trust.forUsers(List.of(guest)).get(guest.getId());
        assertEquals(2, t.meetupsAttended());
        assertEquals(0, t.noShows());

        assertThrows(ApiException.class, () -> planService.markAttendance(futurePlan.getId(), host.getId(), false));
        assertThrows(ApiException.class, () -> planService.markAttendance(noShow.getId(), guest.getId(), false));
    }

    private JoinRequest accepted(AppUser host, AppUser guest, Instant startsAt) {
        Plan plan = new Plan();
        plan.setHost(host);
        plan.setTitle("Walk");
        plan.setCategory(Plan.Category.WALK);
        plan.setPlaceName("Park");
        plan.setLat(35.6);
        plan.setLng(139.7);
        plan.setStartsAt(startsAt);
        plan.setCapacity(3);
        plans.save(plan);
        JoinRequest request = new JoinRequest(plan, guest);
        request.setStatus(JoinRequest.Status.ACCEPTED);
        return requests.save(request);
    }
}
