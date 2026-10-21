package com.meetup.repo;

import com.meetup.domain.BlockedUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {

    Optional<BlockedUser> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @EntityGraph(attributePaths = "blocked")
    List<BlockedUser> findByBlockerIdOrderByCreatedAtDesc(Long blockerId);

    @Query("select count(b) > 0 from BlockedUser b where (b.blocker.id = :a and b.blocked.id = :b) or (b.blocker.id = :b and b.blocked.id = :a)")
    boolean existsEitherDirection(@Param("a") Long a, @Param("b") Long b);

    /** The "other side" user id of every block row touching {@code userId}, in either direction. */
    @Query("""
            select case when b.blocker.id = :userId then b.blocked.id else b.blocker.id end
            from BlockedUser b where b.blocker.id = :userId or b.blocked.id = :userId
            """)
    List<Long> findRelatedUserIds(@Param("userId") Long userId);
}
