package com.meetup.repo;

import com.meetup.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByGoogleSub(String googleSub);

    boolean existsByEmailIgnoreCase(String email);
}
