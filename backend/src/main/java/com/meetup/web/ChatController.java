package com.meetup.web;

import com.meetup.service.ChatService;
import com.meetup.web.ChatDtos.ConversationView;
import com.meetup.web.ChatDtos.MessageView;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Reading and opening chats. Sending and live delivery go over the WebSocket. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chat;

    @GetMapping("/conversations")
    List<ConversationView> list(@AuthenticationPrincipal Jwt jwt) {
        return chat.list(userId(jwt));
    }

    @GetMapping("/conversations/{id}")
    ConversationView get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return chat.get(id, userId(jwt));
    }

    @GetMapping("/conversations/{id}/messages")
    List<MessageView> history(@PathVariable Long id,
                              @RequestParam(required = false) Long before,
                              @RequestParam(defaultValue = "50") int limit,
                              @AuthenticationPrincipal Jwt jwt) {
        return chat.history(id, userId(jwt), before, limit);
    }

    @PostMapping("/conversations/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markRead(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        chat.markRead(id, userId(jwt));
    }

    @PostMapping("/conversations/direct/{userId}")
    ConversationView openDirect(@PathVariable Long userId, @AuthenticationPrincipal Jwt jwt) {
        return chat.openDirect(userId(jwt), userId);
    }

    @GetMapping("/plans/{planId}/conversation")
    ConversationView planConversation(@PathVariable Long planId, @AuthenticationPrincipal Jwt jwt) {
        return chat.planConversation(planId, userId(jwt));
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
