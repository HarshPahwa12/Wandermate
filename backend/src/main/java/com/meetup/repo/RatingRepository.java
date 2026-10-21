package com.meetup.repo;

import com.meetup.domain.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByPlanIdAndRaterIdAndRateeId(Long planId, Long raterId, Long rateeId);

    long countByRateeId(Long rateeId);

    @Query("select avg(r.stars) from Rating r where r.ratee.id = :rateeId")
    Double averageFor(@Param("rateeId") Long rateeId);

    @Query("""
            select r.ratee.id as userId, avg(r.stars) as average, count(r) as total
            from Rating r where r.ratee.id in :userIds group by r.ratee.id
            """)
    List<RatingAggregate> aggregateFor(@Param("userIds") Collection<Long> userIds);

    interface RatingAggregate {
        Long getUserId();

        Double getAverage();

        long getTotal();
    }

    @Query("select r.ratee.id from Rating r where r.plan.id = :planId and r.rater.id = :raterId")
    List<Long> findRateeIdsByPlanAndRater(@Param("planId") Long planId, @Param("raterId") Long raterId);
}
