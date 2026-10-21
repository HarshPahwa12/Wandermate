package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.domain.PasswordResetToken;
import com.meetup.repo.PasswordResetTokenRepository;
import com.meetup.repo.UserRepository;
import com.meetup.web.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Transactional
public class PasswordResetService {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(30);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final ForgotPasswordRateLimiter limiter;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Always succeeds from the caller's point of view, whether or not the email is registered,
     * so the endpoint can't be used to check who has an account.
     */
    public void requestReset(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        limiter.check(email);

        users.findByEmailIgnoreCase(email).ifPresent(user -> {
            tokens.deleteUnusedForUser(user.getId());

            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

            tokens.save(new PasswordResetToken(user, sha256(rawToken), Instant.now().plus(TOKEN_TTL)));

            String link = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + rawToken;
            mail.send(email, "Reset your WanderMate password",
                    "Someone asked to reset the password for this account.\n\n"
                            + "Reset it here (valid for 30 minutes): " + link + "\n\n"
                            + "If this wasn't you, you can ignore this email.");
        });
    }

    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokens.findByTokenHash(sha256(rawToken))
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> ApiException.badRequest("This reset link is invalid or has expired"));

        AppUser user = token.getUser();
        user.setPasswordHash(encoder.encode(newPassword));
        token.setUsedAt(Instant.now());
        tokens.deleteUnusedForUser(user.getId());
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
