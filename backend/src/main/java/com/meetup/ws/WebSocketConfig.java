package com.meetup.ws;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

/**
 * STOMP over WebSocket at /ws.
 * <ul>
 *   <li>Clients send to /app/**</li>
 *   <li>Group chat is delivered on /topic/conversations/{id}</li>
 *   <li>Per-user notifications and errors on /user/queue/**</li>
 * </ul>
 * The broker is in-memory by default (fine for one instance). Set {@code app.chat.broker=relay} to hand
 * fan-out to an external STOMP broker such as RabbitMQ so several server instances can share chats.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthInterceptor authInterceptor;

    @Value("${app.cors.origins}")
    private List<String> allowedOrigins;

    @Value("${app.chat.broker:simple}")
    private String broker;

    @Value("${app.chat.relay.host:localhost}")
    private String relayHost;

    @Value("${app.chat.relay.port:61613}")
    private int relayPort;

    @Value("${app.chat.relay.username:guest}")
    private String relayUsername;

    @Value("${app.chat.relay.password:guest}")
    private String relayPassword;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns(allowedOrigins.toArray(String[]::new));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");

        if ("relay".equalsIgnoreCase(broker)) {
            registry.enableStompBrokerRelay("/topic", "/queue")
                    .setRelayHost(relayHost)
                    .setRelayPort(relayPort)
                    .setClientLogin(relayUsername)
                    .setClientPasscode(relayPassword)
                    .setSystemLogin(relayUsername)
                    .setSystemPasscode(relayPassword);
        } else {
            ThreadPoolTaskScheduler heartbeat = new ThreadPoolTaskScheduler();
            heartbeat.setPoolSize(1);
            heartbeat.setThreadNamePrefix("ws-heartbeat-");
            heartbeat.initialize();
            registry.enableSimpleBroker("/topic", "/queue")
                    .setHeartbeatValue(new long[]{10_000, 10_000})
                    .setTaskScheduler(heartbeat);
        }
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}
