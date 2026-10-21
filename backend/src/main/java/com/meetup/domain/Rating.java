package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A 1-5 star rating left by one plan participant about another, once the plan has happened. */
@Entity
@Table(name = "ratings", uniqueConstraints = @UniqueConstraint(columnNames = {"plan_id", "rater_id", "ratee_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rater_id")
    private AppUser rater;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ratee_id")
    private AppUser ratee;

    @Column(nullable = false)
    private int stars;

    @Column(length = 500)
    private String comment;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Rating(Plan plan, AppUser rater, AppUser ratee, int stars, String comment) {
        this.plan = plan;
        this.rater = rater;
        this.ratee = ratee;
        this.stars = stars;
        this.comment = comment;
    }
}
