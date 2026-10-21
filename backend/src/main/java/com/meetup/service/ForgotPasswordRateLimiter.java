package com.meetup.service;

import com.meetup.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/** Sliding-window limit on password-reset requests per email, so the endpoint can't be used to spam someone. */
@Component
public class ForgotPasswordRateLimiter {

    private static final int MAX_REQUESTS = 3;
    private static final long WINDOW_MILLIS = 15 * 60_000;

    private final ConcurrentHashMap<String, Deque<Long>> recent = new ConcurrentHashMap<>();

    public void check(String email) {
        long now = System.currentTimeMillis();
        Deque<Long> times = recent.computeIfAbsent(email, e -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MILLIS) {
                times.pollFirst();
            }
            if (times.size() >= MAX_REQUESTS) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many reset requests. Try again later.");
            }
            times.addLast(now);
        }
    }
}
