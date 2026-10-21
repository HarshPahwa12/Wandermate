package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "blocked_users", uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"}))
@Getter
@Setter
@NoArgsConstructor
public class BlockedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocker_id")
    private AppUser blocker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocked_id")
    private AppUser blocked;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public BlockedUser(AppUser blocker, AppUser blocked) {
        this.blocker = blocker;
        this.blocked = blocked;
    }
}
