package com.meetup.web;

import com.meetup.domain.AppUser;
import com.meetup.repo.UserRepository;
import com.meetup.security.GoogleTokenVerifier;
import com.meetup.security.JwtService;
import com.meetup.service.PasswordResetService;
import com.meetup.web.Dtos.AuthResponse;
import com.meetup.web.Dtos.ForgotPasswordRequest;
import com.meetup.web.Dtos.GoogleLoginRequest;
import com.meetup.web.Dtos.LoginRequest;
import com.meetup.web.Dtos.RegisterRequest;
import com.meetup.web.Dtos.ResetPasswordRequest;
import com.meetup.web.Dtos.UserView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final int MAX_NAME = 40;

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final GoogleTokenVerifier google;
    private final PasswordResetService passwordReset;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Email is already registered");
        }
        AppUser user = users.save(new AppUser(email, encoder.encode(req.password()), req.displayName().trim()));
        return respond(user);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest req) {
        AppUser user = users.findByEmailIgnoreCase(normalize(req.email()))
                .filter(u -> u.getPasswordHash() != null && encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return respond(user);
    }

    /** Exchanges a Google ID token for our own session token, creating or linking the account. */
    @PostMapping("/google")
    AuthResponse googleLogin(@Valid @RequestBody GoogleLoginRequest req) {
        if (!google.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google sign-in is not configured");
        }
        Jwt token;
        try {
            token = google.verify(req.idToken());
        } catch (JwtException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
        String rawEmail = token.getClaimAsString("email");
        if (rawEmail == null || !Boolean.TRUE.equals(token.getClaimAsBoolean("email_verified"))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Your Google email is not verified");
        }
        String email = normalize(rawEmail);
        String sub = token.getSubject();

        AppUser user = users.findByGoogleSub(sub)
                .or(() -> users.findByEmailIgnoreCase(email).map(existing -> {
                    // Same verified email already registered with a password: link the two.
                    existing.setGoogleSub(sub);
                    return users.save(existing);
                }))
                .orElse(null);
        if (user == null) {
            AppUser created = new AppUser(email, null, googleName(token, email));
            created.setGoogleSub(sub);
            user = users.save(created);
        }
        return respond(user);
    }

    /** Always 200: doesn't reveal whether the email is registered. */
    @PostMapping("/forgot-password")
    void forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.requestReset(req.email());
    }

    @PostMapping("/reset-password")
    void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.resetPassword(req.token(), req.newPassword());
    }

    private AuthResponse respond(AppUser user) {
        return new AuthResponse(jwt.issue(user), new UserView(user.getId(), user.getDisplayName()));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase();
    }

    private static String googleName(Jwt token, String email) {
        String name = token.getClaimAsString("name");
        if (name == null || name.isBlank()) {
            name = email.substring(0, email.indexOf('@'));
        }
        name = name.trim();
        return name.length() > MAX_NAME ? name.substring(0, MAX_NAME) : name;
    }
}
