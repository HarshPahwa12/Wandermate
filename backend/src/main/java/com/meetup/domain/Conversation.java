package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A chat room: either the group chat of one plan, or a private chat between two people. */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    /** Set for PLAN conversations; one conversation per plan. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", unique = true)
    private Plan plan;

    /** Set for DIRECT conversations as "smallerUserId:largerUserId", so a pair can only have one. */
    @Column(unique = true)
    private String directKey;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public enum Type { PLAN, DIRECT }

    public Conversation(Type type) {
        this.type = type;
    }
}
