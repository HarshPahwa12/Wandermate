package com.meetup.repo;

import com.meetup.domain.Plan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    @EntityGraph(attributePaths = "host")
    @Query("""
            select p from Plan p
            where p.status = com.meetup.domain.Plan.PlanStatus.OPEN
              and p.startsAt > :now
            order by p.startsAt
            """)
    List<Plan> findUpcoming(@Param("now") Instant now);

    @EntityGraph(attributePaths = "host")
    @Query("""
            select p from Plan p
            where p.status = com.meetup.domain.Plan.PlanStatus.OPEN
              and p.startsAt > :now
              and p.lat between :minLat and :maxLat
              and p.lng between :minLng and :maxLng
            order by p.startsAt
            """)
    List<Plan> findUpcomingInBox(@Param("now") Instant now,
                                 @Param("minLat") double minLat,
                                 @Param("maxLat") double maxLat,
                                 @Param("minLng") double minLng,
                                 @Param("maxLng") double maxLng);

    @EntityGraph(attributePaths = "host")
    Optional<Plan> findWithHostById(Long id);

    /** Row lock so two simultaneous accepts cannot both take the last spot. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Plan p where p.id = :id")
    Optional<Plan> findByIdForUpdate(@Param("id") Long id);

    /** Plans the user hosts, or was accepted into, past or upcoming. */
    @EntityGraph(attributePaths = "host")
    @Query("""
            select distinct p from Plan p
            left join JoinRequest r on r.plan = p and r.user.id = :userId
                and r.status = com.meetup.domain.JoinRequest.Status.ACCEPTED
            where p.host.id = :userId or r.id is not null
            order by p.startsAt desc
            """)
    List<Plan> findMine(@Param("userId") Long userId);
}
