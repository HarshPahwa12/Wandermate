package com.meetup.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Verifies the ID token the browser gets from "Sign in with Google": signature against Google's
 * published keys, expiry, issuer, and that it was minted for this app's client id.
 */
@Component
public class GoogleTokenVerifier {

    private static final String JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";

    private final String clientId;
    private final JwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId;

        NimbusJwtDecoder nimbus = NimbusJwtDecoder.withJwkSetUri(JWKS_URI).build();
        OAuth2TokenValidator<Jwt> issuer = new JwtClaimValidator<Object>("iss", iss -> {
            String s = String.valueOf(iss);
            return s.equals("https://accounts.google.com") || s.equals("accounts.google.com");
        });
        OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>("aud",
                aud -> aud != null && aud.contains(clientId));
        nimbus.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), issuer, audience));
        this.decoder = nimbus;
    }

    public boolean isConfigured() {
        return !clientId.isBlank();
    }

    /** @throws org.springframework.security.oauth2.jwt.JwtException if the token is not valid for this app */
    public Jwt verify(String idToken) {
        return decoder.decode(idToken);
    }
}
