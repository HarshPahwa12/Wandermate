package com.meetup.repo;

import com.meetup.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @EntityGraph(attributePaths = "user")
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Clears any still-usable tokens for the user: called before issuing a new one, and after a reset. */
    @Modifying
    @Query("delete from PasswordResetToken t where t.user.id = :userId and t.usedAt is null")
    void deleteUnusedForUser(@Param("userId") Long userId);
}
