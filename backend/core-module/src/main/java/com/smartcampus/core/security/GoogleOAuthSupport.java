package com.smartcampus.core.security;

import org.springframework.core.env.Environment;

/**
 * Detects whether real Google OAuth credentials are configured. Placeholder values in
 * {@code application.yml} must not trigger the OAuth redirect to Google (which returns
 * {@code invalid_client}).
 */
public final class GoogleOAuthSupport {

    private static final String CLIENT_ID_KEY = "spring.security.oauth2.client.registration.google.client-id";
    private static final String CLIENT_SECRET_KEY = "spring.security.oauth2.client.registration.google.client-secret";

    private GoogleOAuthSupport() {}

    public static boolean isConfigured(Environment env) {
        if (env == null) {
            return false;
        }
        String clientId = env.getProperty(CLIENT_ID_KEY);
        String clientSecret = env.getProperty(CLIENT_SECRET_KEY);
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            return false;
        }
        String id = clientId.trim();
        String secret = clientSecret.trim();
        if ("PLACEHOLDER_GOOGLE_CLIENT_ID".equals(id) || "PLACEHOLDER_GOOGLE_CLIENT_SECRET".equals(secret)) {
            return false;
        }
        if (id.contains("PLACEHOLDER") || secret.contains("PLACEHOLDER")) {
            return false;
        }
        if (id.toUpperCase().contains("YOUR_") || secret.toUpperCase().contains("YOUR_")) {
            return false;
        }
        return id.endsWith(".apps.googleusercontent.com");
    }
}
