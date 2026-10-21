package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.domain.JoinRequest;
import com.meetup.domain.Plan;
import com.meetup.repo.JoinRequestRepository;
import com.meetup.repo.PlanRepository;
import com.meetup.repo.UserRepository;
import com.meetup.web.ApiException;
import com.meetup.web.Dtos.CreatePlanRequest;
import com.meetup.web.Dtos.PlanView;
import com.meetup.web.Dtos.RequestView;
import com.meetup.web.Dtos.TrustView;
import com.meetup.web.Dtos.UserView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double KM_PER_DEGREE_LAT = 111.0;

    private final PlanRepository plans;
    private final JoinRequestRepository requests;
    private final UserRepository users;
    private final ChatService chat;
    private final BlockService blocks;
    private final RatingService ratingService;
    private final TrustService trustService;

    @Transactional(readOnly = true)
    public List<PlanView> list(Double lat, Double lng, double radiusKm, Plan.Category category, String q,
                                Instant from, Instant to, Long viewerId) {
        Instant now = Instant.now();
        boolean geo = lat != null && lng != null;

        List<Plan> found;
        if (geo) {
            double latDelta = radiusKm / KM_PER_DEGREE_LAT;
            double lngDelta = radiusKm / (KM_PER_DEGREE_LAT * Math.max(0.01, Math.cos(Math.toRadians(lat))));
            found = plans.findUpcomingInBox(now, lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta);
        } else {
            found = plans.findUpcoming(now);
        }

        // Hidden either way: blocked hosts never show up in your feed, and you never show up in theirs.
        Set<Long> relatedBlocks = viewerId == null ? Set.of() : blocks.relatedBlockIds(viewerId);
        String needle = q == null || q.isBlank() ? null : q.trim().toLowerCase();

        // Distance, search and the response only ever use what this viewer is allowed to see of the location.
        Set<Long> memberPlanIds = viewerId == null ? Set.of() : Set.copyOf(requests.findAcceptedPlanIds(viewerId));
        Map<Long, Where> where = found.stream().collect(Collectors.toMap(Plan::getId,
                p -> where(p, p.getHost().getId().equals(viewerId) || memberPlanIds.contains(p.getId()))));

        List<Plan> filtered = found.stream()
                .filter(p -> category == null || p.getCategory() == category)
                .filter(p -> !geo || distanceKm(lat, lng, where.get(p.getId()).lat(), where.get(p.getId()).lng()) <= radiusKm)
                .filter(p -> !relatedBlocks.contains(p.getHost().getId()))
                .filter(p -> from == null || !p.getStartsAt().isBefore(from))
                .filter(p -> to == null || !p.getStartsAt().isAfter(to))
                .filter(p -> needle == null
                        || p.getTitle().toLowerCase().contains(needle)
                        || where.get(p.getId()).name().toLowerCase().contains(needle)
                        || (p.getDescription() != null && p.getDescription().toLowerCase().contains(needle)))
                .toList();

        Map<Long, Long> accepted = acceptedCounts(filtered);
        return filtered.stream()
                .map(p -> summary(p, accepted.getOrDefault(p.getId(), 0L).intValue(), where.get(p.getId()),
                        geo ? distanceKm(lat, lng, where.get(p.getId()).lat(), where.get(p.getId()).lng()) : null))
                .sorted(geo
                        ? Comparator.comparing(PlanView::distanceKm)
                        : Comparator.comparing(PlanView::startsAt))
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanView get(Long planId, Long viewerId) {
        Plan plan = plans.findWithHostById(planId).orElseThrow(() -> ApiException.notFound("Plan not found"));
        if (viewerId != null && blocks.isBlockedEitherWay(viewerId, plan.getHost().getId())) {
            throw ApiException.notFound("Plan not found");
        }
        List<JoinRequest> all = requests.findByPlanIdOrderByCreatedAt(planId);
        int accepted = (int) all.stream().filter(r -> r.getStatus() == JoinRequest.Status.ACCEPTED).count();

        boolean isHost = viewerId != null && viewerId.equals(plan.getHost().getId());
        JoinRequest.Status mine = viewerId == null ? null : all.stream()
                .filter(r -> r.getUser().getId().equals(viewerId))
                .map(JoinRequest::getStatus)
                .findFirst().orElse(null);
        List<RequestView> visible = null;
        if (isHost) {
            Set<Long> blockedIds = blocks.relatedBlockIds(viewerId);
            Map<Long, TrustView> trust = trustService.forUsers(all.stream().map(JoinRequest::getUser).toList());
            visible = all.stream()
                    .map(r -> new RequestView(r.getId(), userView(r.getUser()), r.getStatus(),
                            blockedIds.contains(r.getUser().getId()), trust.get(r.getUser().getId()),
                            r.getAttended()))
                    .toList();
        }
        List<Long> ratedUserIds = viewerId == null ? null : ratingService.ratedByMe(planId, viewerId);
        Where loc = where(plan, isHost || mine == JoinRequest.Status.ACCEPTED);

        return new PlanView(plan.getId(), plan.getTitle(), plan.getDescription(), plan.getCategory(),
                loc.name(), loc.lat(), loc.lng(), plan.getStartsAt(), plan.getCapacity(),
                Math.max(0, plan.getCapacity() - accepted), userView(plan.getHost()), null, isHost, mine, visible,
                ratedUserIds, plan.getAreaName(), loc.exact());
    }

    public PlanView update(Long planId, Long hostId, CreatePlanRequest req) {
        Plan plan = plans.findWithHostById(planId).orElseThrow(() -> ApiException.notFound("Plan not found"));
        if (!plan.getHost().getId().equals(hostId)) {
            throw ApiException.forbidden("Only the host can edit this plan");
        }
        if (!plan.getStartsAt().isAfter(Instant.now())) {
            throw ApiException.conflict("This plan has already happened");
        }
        int accepted = (int) requests.countByPlanIdAndStatus(planId, JoinRequest.Status.ACCEPTED);
        if (req.capacity() < accepted) {
            throw ApiException.badRequest("Capacity can't be less than the " + accepted + " guests already accepted");
        }
        plan.setTitle(req.title().trim());
        plan.setDescription(req.description());
        plan.setCategory(req.category());
        plan.setPlaceName(req.placeName().trim());
        plan.setAreaName(req.areaName().trim());
        plan.setLat(req.lat());
        plan.setLng(req.lng());
        plan.setStartsAt(req.startsAt());
        plan.setCapacity(req.capacity());
        return get(planId, hostId);
    }

    @Transactional(readOnly = true)
    public List<PlanView> listMine(Long userId) {
        List<Plan> found = plans.findMine(userId);
        Map<Long, Long> accepted = acceptedCounts(found);
        return found.stream()
                .map(p -> mine(p, userId, accepted.getOrDefault(p.getId(), 0L).intValue()))
                .toList();
    }

    public PlanView create(Long hostId, CreatePlanRequest req) {
        Plan plan = new Plan();
        plan.setHost(users.getReferenceById(hostId));
        plan.setTitle(req.title().trim());
        plan.setDescription(req.description());
        plan.setCategory(req.category());
        plan.setPlaceName(req.placeName().trim());
        plan.setAreaName(req.areaName().trim());
        plan.setLat(req.lat());
        plan.setLng(req.lng());
        plan.setStartsAt(req.startsAt());
        plan.setCapacity(req.capacity());
        plans.save(plan);
        chat.createPlanConversation(plan);
        return get(plan.getId(), hostId);
    }

    public void join(Long planId, Long userId) {
        Plan plan = plans.findWithHostById(planId).orElseThrow(() -> ApiException.notFound("Plan not found"));
        if (blocks.isBlockedEitherWay(userId, plan.getHost().getId())) {
            throw ApiException.notFound("Plan not found");
        }
        if (plan.getHost().getId().equals(userId)) {
            throw ApiException.badRequest("You are hosting this plan");
        }
        if (plan.getStatus() != Plan.PlanStatus.OPEN || !plan.getStartsAt().isAfter(Instant.now())) {
            throw ApiException.conflict("This plan is no longer open");
        }
        if (requests.findByPlanIdAndUserId(planId, userId).isPresent()) {
            throw ApiException.conflict("You already requested to join");
        }
        if (requests.countByPlanIdAndStatus(planId, JoinRequest.Status.ACCEPTED) >= plan.getCapacity()) {
            throw ApiException.conflict("This plan is full");
        }
        requests.save(new JoinRequest(plan, users.getReferenceById(userId)));
    }

    public void cancelJoin(Long planId, Long userId) {
        JoinRequest request = requests.findByPlanIdAndUserId(planId, userId)
                .orElseThrow(() -> ApiException.notFound("No request to cancel"));
        boolean wasAccepted = request.getStatus() == JoinRequest.Status.ACCEPTED;
        requests.delete(request);
        if (wasAccepted) {
            chat.removePlanMember(planId, userId);
        }
    }

    public void decide(Long requestId, Long hostId, boolean accept) {
        JoinRequest request = requests.findWithPlanById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        if (!request.getPlan().getHost().getId().equals(hostId)) {
            throw ApiException.forbidden("Only the host can decide on requests");
        }
        if (request.getStatus() != JoinRequest.Status.PENDING) {
            throw ApiException.conflict("Request was already decided");
        }
        if (accept) {
            // Serialise concurrent accepts for the same plan, then re-check capacity under the lock.
            Plan locked = plans.findByIdForUpdate(request.getPlan().getId()).orElseThrow();
            if (requests.countByPlanIdAndStatus(locked.getId(), JoinRequest.Status.ACCEPTED) >= locked.getCapacity()) {
                throw ApiException.conflict("This plan is full");
            }
            request.setStatus(JoinRequest.Status.ACCEPTED);
            chat.addPlanMember(locked, request.getUser().getId());
        } else {
            request.setStatus(JoinRequest.Status.DECLINED);
        }
    }

    /** The host records who actually turned up; only possible for accepted guests once the plan has started. */
    public void markAttendance(Long requestId, Long hostId, boolean attended) {
        JoinRequest request = requests.findWithPlanById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        if (!request.getPlan().getHost().getId().equals(hostId)) {
            throw ApiException.forbidden("Only the host can record attendance");
        }
        if (request.getStatus() != JoinRequest.Status.ACCEPTED) {
            throw ApiException.badRequest("Only accepted guests can be marked");
        }
        if (request.getPlan().getStartsAt().isAfter(Instant.now())) {
            throw ApiException.badRequest("You can record attendance once the plan has started");
        }
        request.setAttended(attended);
    }

    private Map<Long, Long> acceptedCounts(List<Plan> found) {
        if (found.isEmpty()) {
            return Map.of();
        }
        return requests.countAcceptedByPlanIds(found.stream().map(Plan::getId).toList()).stream()
                .collect(Collectors.toMap(JoinRequestRepository.AcceptedCount::getPlanId,
                        JoinRequestRepository.AcceptedCount::getAccepted));
    }

    private PlanView summary(Plan p, int accepted, Where loc, Double distanceKm) {
        return new PlanView(p.getId(), p.getTitle(), null, p.getCategory(), loc.name(), loc.lat(), loc.lng(),
                p.getStartsAt(), p.getCapacity(), Math.max(0, p.getCapacity() - accepted), userView(p.getHost()),
                distanceKm, false, null, null, null, p.getAreaName(), loc.exact());
    }

    /** Only called for the viewer's own plans (hosting or accepted), so the exact location is always theirs to see. */
    private PlanView mine(Plan p, Long userId, int accepted) {
        boolean isHost = p.getHost().getId().equals(userId);
        JoinRequest.Status mine = isHost ? null : JoinRequest.Status.ACCEPTED;
        Where loc = where(p, true);
        return new PlanView(p.getId(), p.getTitle(), p.getDescription(), p.getCategory(), loc.name(),
                loc.lat(), loc.lng(), p.getStartsAt(), p.getCapacity(), Math.max(0, p.getCapacity() - accepted),
                userView(p.getHost()), null, isHost, mine, null, null, p.getAreaName(), true);
    }

    /** The location as one viewer is allowed to see it. */
    private record Where(String name, double lat, double lng, boolean exact) {
    }

    private static Where where(Plan p, boolean exact) {
        if (exact) {
            return new Where(p.getPlaceName(), p.getLat(), p.getLng(), true);
        }
        String area = p.getAreaName() == null || p.getAreaName().isBlank() ? "Nearby" : p.getAreaName();
        return new Where(area, coarse(p.getLat()), coarse(p.getLng()), false);
    }

    /** Two decimal places is a grid of roughly 1.1 km, enough to place a plan in a neighbourhood and no better. */
    private static double coarse(double degrees) {
        return Math.round(degrees * 100) / 100.0;
    }

    private static UserView userView(AppUser u) {
        return new UserView(u.getId(), u.getDisplayName());
    }

    /** Haversine great-circle distance. */
    static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
