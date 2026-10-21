package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private AppUser reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reported_id")
    private AppUser reported;

    /** The plan the report relates to, if any. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Report(AppUser reporter, AppUser reported, Plan plan, String reason) {
        this.reporter = reporter;
        this.reported = reported;
        this.plan = plan;
        this.reason = reason;
    }
}
