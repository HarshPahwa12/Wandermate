package com.meetup.ws;

import com.meetup.service.ChatService;
import com.meetup.web.ApiException;
import com.meetup.web.ChatDtos.SendPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final ChatService chat;
    private final SimpMessagingTemplate template;

    /** Client sends to /app/chat/{id}; we save, then fan out to the room and ping each member's inbox. */
    @MessageMapping("/chat/{conversationId}")
    public void send(@DestinationVariable Long conversationId, @Payload SendPayload payload, Principal principal) {
        Long me = Long.valueOf(principal.getName());
        ChatService.Sent sent = chat.send(conversationId, me, payload.body());

        template.convertAndSend("/topic/conversations/" + conversationId, sent.message());
        for (Long recipient : sent.recipientIds()) {
            template.convertAndSendToUser(String.valueOf(recipient), "/queue/notifications", sent.message());
        }
    }

    /** Rule violations come back to just the sender on /user/queue/errors. */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public Map<String, String> onError(Exception e) {
        String message = e instanceof ApiException ? e.getMessage() : "Couldn't send that message";
        return Map.of("message", message);
    }
}
