package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stored lower-case. */
    @Column(nullable = false, unique = true)
    private String email;

    /** Null for accounts that only sign in with Google. */
    private String passwordHash;

    /** Google's stable user id (the {@code sub} claim), once the account has used Google sign-in. */
    @Column(unique = true)
    private String googleSub;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public AppUser(String email, String passwordHash, String displayName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
    }
}
