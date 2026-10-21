package com.meetup.repo;

import com.meetup.domain.JoinRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    Optional<JoinRequest> findByPlanIdAndUserId(Long planId, Long userId);

    @EntityGraph(attributePaths = "user")
    List<JoinRequest> findByPlanIdOrderByCreatedAt(Long planId);

    @EntityGraph(attributePaths = {"plan", "plan.host"})
    Optional<JoinRequest> findWithPlanById(Long id);

    long countByPlanIdAndStatus(Long planId, JoinRequest.Status status);

    @Query("""
            select r.plan.id as planId, count(r) as accepted
            from JoinRequest r
            where r.plan.id in :planIds and r.status = com.meetup.domain.JoinRequest.Status.ACCEPTED
            group by r.plan.id
            """)
    List<AcceptedCount> countAcceptedByPlanIds(@Param("planIds") Collection<Long> planIds);

    /** One of the two hosts a plan that the other has requested to join (pending or accepted). */
    @Query("""
            select count(r) > 0 from JoinRequest r
            where r.status <> com.meetup.domain.JoinRequest.Status.DECLINED
              and ((r.plan.host.id = :a and r.user.id = :b) or (r.plan.host.id = :b and r.user.id = :a))
            """)
    boolean existsHostLink(@Param("a") Long a, @Param("b") Long b);

    /** Both people were accepted into the same plan. */
    @Query("""
            select count(r1) > 0 from JoinRequest r1, JoinRequest r2
            where r1.plan.id = r2.plan.id
              and r1.status = com.meetup.domain.JoinRequest.Status.ACCEPTED
              and r2.status = com.meetup.domain.JoinRequest.Status.ACCEPTED
              and r1.user.id = :a and r2.user.id = :b
            """)
    boolean existsCoGuests(@Param("a") Long a, @Param("b") Long b);

    /** Past plans each user was accepted into, minus the ones the host marked as no-shows. */
    @Query("""
            select r.user.id as userId, count(r) as total
            from JoinRequest r
            where r.user.id in :userIds
              and r.status = com.meetup.domain.JoinRequest.Status.ACCEPTED
              and r.plan.startsAt < :now
              and (r.attended is null or r.attended = true)
            group by r.user.id
            """)
    List<UserCount> countAttendedByUserIds(@Param("userIds") Collection<Long> userIds, @Param("now") Instant now);

    @Query("""
            select r.user.id as userId, count(r) as total
            from JoinRequest r
            where r.user.id in :userIds and r.attended = false
            group by r.user.id
            """)
    List<UserCount> countNoShowsByUserIds(@Param("userIds") Collection<Long> userIds);

    @Query("""
            select r.plan.id from JoinRequest r
            where r.user.id = :userId and r.status = com.meetup.domain.JoinRequest.Status.ACCEPTED
            """)
    List<Long> findAcceptedPlanIds(@Param("userId") Long userId);

    interface UserCount {
        Long getUserId();

        long getTotal();
    }

    interface AcceptedCount {
        Long getPlanId();

        long getAccepted();
    }
}
