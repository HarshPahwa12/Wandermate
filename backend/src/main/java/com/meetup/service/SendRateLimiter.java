package com.meetup.service;

import com.meetup.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/** Sliding-window limit on chat sends per user. In-memory, so per server instance. */
@Component
public class SendRateLimiter {

    private static final int MAX_MESSAGES = 15;
    private static final long WINDOW_MILLIS = 10_000;

    private final ConcurrentHashMap<Long, Deque<Long>> recent = new ConcurrentHashMap<>();

    public void check(Long userId) {
        long now = System.currentTimeMillis();
        Deque<Long> times = recent.computeIfAbsent(userId, id -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MILLIS) {
                times.pollFirst();
            }
            if (times.size() >= MAX_MESSAGES) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "You're sending messages too fast");
            }
            times.addLast(now);
        }
    }
}
