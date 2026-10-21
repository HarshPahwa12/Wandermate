package com.meetup.ws;

import com.meetup.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

/**
 * Browsers can't send an Authorization header on a WebSocket, so the JWT arrives in the STOMP CONNECT frame.
 * This checks it once, pins the user to the session, and then guards every subscription.
 */
@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    static final String CONVERSATION_TOPIC = "/topic/conversations/";
    static final String USER_QUEUE = "/user/queue/";

    private final JwtDecoder decoder;
    private final ChatService chat;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        StompCommand command = accessor == null ? null : accessor.getCommand();
        if (command == null) {
            return message; // heartbeat
        }
        switch (command) {
            case CONNECT -> authenticate(accessor);
            case SUBSCRIBE -> authorizeSubscribe(accessor);
            case SEND -> userId(accessor);
            default -> {
            }
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new MessagingException("Missing token");
        }
        Jwt jwt;
        try {
            jwt = decoder.decode(header.substring(7));
        } catch (JwtException e) {
            throw new MessagingException("Invalid token");
        }
        accessor.setUser(new UsernamePasswordAuthenticationToken(jwt.getSubject(), null, List.of()));
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        Long userId = userId(accessor);
        String destination = accessor.getDestination();
        if (destination == null) {
            throw new MessagingException("Missing destination");
        }
        if (destination.startsWith(CONVERSATION_TOPIC)) {
            Long conversationId = parseId(destination.substring(CONVERSATION_TOPIC.length()));
            if (conversationId == null || !chat.isMember(conversationId, userId)) {
                throw new MessagingException("Not a member of this conversation");
            }
        } else if (!destination.startsWith(USER_QUEUE)) {
            throw new MessagingException("Destination not allowed");
        }
    }

    private static Long userId(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            throw new MessagingException("Not authenticated");
        }
        return Long.valueOf(user.getName());
    }

    private static Long parseId(String raw) {
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
