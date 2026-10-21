package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.repo.JoinRequestRepository;
import com.meetup.repo.JoinRequestRepository.UserCount;
import com.meetup.repo.RatingRepository;
import com.meetup.repo.RatingRepository.RatingAggregate;
import com.meetup.web.Dtos.TrustView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Builds the reputation snapshot a host sees next to each join request. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrustService {

    private final RatingRepository ratings;
    private final JoinRequestRepository requests;

    public Map<Long, TrustView> forUsers(Collection<AppUser> users) {
        if (users.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = users.stream().map(AppUser::getId).distinct().toList();
        Map<Long, RatingAggregate> rated = ratings.aggregateFor(ids).stream()
                .collect(Collectors.toMap(RatingAggregate::getUserId, Function.identity()));
        Map<Long, Long> attended = counts(requests.countAttendedByUserIds(ids, Instant.now()));
        Map<Long, Long> noShows = counts(requests.countNoShowsByUserIds(ids));

        return users.stream().collect(Collectors.toMap(AppUser::getId, u -> {
            RatingAggregate agg = rated.get(u.getId());
            return new TrustView(agg == null ? null : agg.getAverage(), agg == null ? 0 : agg.getTotal(),
                    attended.getOrDefault(u.getId(), 0L), noShows.getOrDefault(u.getId(), 0L), u.getCreatedAt());
        }, (a, b) -> a));
    }

    private static Map<Long, Long> counts(List<UserCount> rows) {
        return rows.stream().collect(Collectors.toMap(UserCount::getUserId, UserCount::getTotal));
    }
}
