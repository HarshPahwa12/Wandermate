package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "plans", indexes = {
        @Index(name = "idx_plans_starts_at", columnList = "startsAt"),
        @Index(name = "idx_plans_geo", columnList = "lat,lng")
})
@Getter
@Setter
@NoArgsConstructor
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser host;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    /** The exact meeting spot. Only the host and accepted guests see it. */
    @Column(nullable = false)
    private String placeName;

    /** Neighbourhood-level label shown to everyone else. Null on plans created before this existed. */
    private String areaName;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(nullable = false)
    private Instant startsAt;

    /** Number of guests the host will accept, not counting the host. */
    @Column(nullable = false)
    private int capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanStatus status = PlanStatus.OPEN;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public enum Category { WALK, COFFEE, FOOD, GAMES, SPORTS, OTHER }

    public enum PlanStatus { OPEN, CANCELLED }
}
