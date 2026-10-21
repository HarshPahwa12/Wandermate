package com.meetup.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "messages", indexes = @Index(name = "idx_messages_conversation", columnList = "conversation_id,id"))
@Getter
@Setter
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id")
    private AppUser sender;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Message(Conversation conversation, AppUser sender, String body) {
        this.conversation = conversation;
        this.sender = sender;
        this.body = body;
    }
}
