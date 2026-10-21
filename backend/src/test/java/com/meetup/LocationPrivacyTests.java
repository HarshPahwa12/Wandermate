package com.meetup;

import com.meetup.domain.AppUser;
import com.meetup.domain.Plan;
import com.meetup.repo.UserRepository;
import com.meetup.service.PlanService;
import com.meetup.web.Dtos.CreatePlanRequest;
import com.meetup.web.Dtos.PlanView;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:location;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE")
@ActiveProfiles("h2")
class LocationPrivacyTests {

    private static final double EXACT_LAT = 35.65871;
    private static final double EXACT_LNG = 139.70132;

    @Autowired UserRepository users;
    @Autowired PlanService planService;

    @Test
    void exactSpotIsOnlyVisibleToHostAndAcceptedGuests() {
        AppUser host = users.save(new AppUser("loc-host@t.io", "x", "Host"));
        AppUser pending = users.save(new AppUser("loc-pending@t.io", "x", "Pending"));
        AppUser guest = users.save(new AppUser("loc-guest@t.io", "x", "Guest"));
        AppUser stranger = users.save(new AppUser("loc-stranger@t.io", "x", "Stranger"));

        Long planId = planService.create(host.getId(), new CreatePlanRequest("Coffee", null, Plan.Category.COFFEE,
                "Blue Door Cafe", "Shibuya", EXACT_LAT, EXACT_LNG, Instant.now().plus(Duration.ofDays(1)), 3)).id();
        planService.join(planId, pending.getId());
        planService.join(planId, guest.getId());
        Long guestRequestId = planService.get(planId, host.getId()).requests().stream()
                .filter(r -> r.user().id().equals(guest.getId())).findFirst().orElseThrow().id();
        planService.decide(guestRequestId, host.getId(), true);

        assertExact(planService.get(planId, host.getId()));
        assertExact(planService.get(planId, guest.getId()));
        assertHidden(planService.get(planId, pending.getId()));
        assertHidden(planService.get(planId, stranger.getId()));
        assertHidden(planService.get(planId, null));

        // The feed follows the same rules.
        assertExact(feed(null, host.getId(), null).get(0));
        assertExact(feed(null, guest.getId(), null).get(0));
        assertHidden(feed(null, stranger.getId(), null).get(0));
        assertHidden(feed(null, null, null).get(0));

        // Searching for the venue must not reveal a plan to people who can't see the venue, but the area works.
        assertTrue(feed("blue door", stranger.getId(), null).isEmpty());
        assertEquals(1, feed("shibuya", stranger.getId(), null).size());
        assertEquals(1, feed("blue door", guest.getId(), null).size());

        // Distance for a stranger is measured to the rounded point, never the exact one.
        double exactKm = distanceFromOrigin(EXACT_LAT, EXACT_LNG);
        PlanView seen = planService.list(0.0, 0.0, 20000, null, null, null, null, stranger.getId()).get(0);
        assertEquals(distanceFromOrigin(35.66, 139.70), seen.distanceKm(), 0.001);
        assertNotEquals(exactKm, seen.distanceKm(), 0.0001);

        // My plans always carry the exact spot.
        assertExact(planService.listMine(guest.getId()).get(0));
    }

    private List<PlanView> feed(String q, Long viewerId, Plan.Category category) {
        return planService.list(null, null, 10, category, q, null, null, viewerId);
    }

    private static double distanceFromOrigin(double lat, double lng) {
        double dLat = Math.toRadians(lat);
        double dLng = Math.toRadians(lng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(dLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static void assertExact(PlanView v) {
        assertTrue(v.locationExact());
        assertEquals("Blue Door Cafe", v.placeName());
        assertEquals(EXACT_LAT, v.lat());
        assertEquals(EXACT_LNG, v.lng());
    }

    private static void assertHidden(PlanView v) {
        assertFalse(v.locationExact());
        assertEquals("Shibuya", v.placeName());
        assertEquals(35.66, v.lat());
        assertEquals(139.70, v.lng());
    }
}
