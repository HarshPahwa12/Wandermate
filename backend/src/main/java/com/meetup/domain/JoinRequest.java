package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "join_requests", uniqueConstraints =
        @UniqueConstraint(name = "uq_request_plan_user", columnNames = {"plan_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /** Set by the host after the plan: true = showed up, false = no-show, null = not marked (counts as attended). */
    private Boolean attended;

    public enum Status { PENDING, ACCEPTED, DECLINED }

    public JoinRequest(Plan plan, AppUser user) {
        this.plan = plan;
        this.user = user;
    }
}
