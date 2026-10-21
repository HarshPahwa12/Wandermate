package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "conversation_members", uniqueConstraints =
        @UniqueConstraint(name = "uq_member_conversation_user", columnNames = {"conversation_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ConversationMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    /** Messages from other people after this moment count as unread. */
    @Column(nullable = false)
    private Instant lastReadAt = Instant.now();

    public ConversationMember(Conversation conversation, AppUser user) {
        this.conversation = conversation;
        this.user = user;
    }
}
