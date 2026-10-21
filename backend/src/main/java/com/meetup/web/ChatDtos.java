package com.meetup.web;

import com.meetup.domain.Conversation;
import com.meetup.web.Dtos.UserView;

import java.time.Instant;

public final class ChatDtos {

    private ChatDtos() {
    }

    public record MessageView(Long id, Long conversationId, UserView sender, String body, Instant createdAt) {
    }

    /**
     * {@code title} is the plan name for group chats and the other person's name for direct chats.
     * {@code other} is only set for direct chats. {@code blocked} is true for a direct chat where either
     * side has blocked the other, meaning the composer should be disabled.
     */
    public record ConversationView(
            Long id,
            Conversation.Type type,
            String title,
            Long planId,
            UserView other,
            MessageView lastMessage,
            long unread,
            boolean blocked) {
    }

    /** Body of a message sent over the WebSocket. */
    public record SendPayload(String body) {
    }
}
