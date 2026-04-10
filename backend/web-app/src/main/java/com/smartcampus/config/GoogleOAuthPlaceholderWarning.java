package com.smartcampus.config;

import com.smartcampus.core.security.GoogleOAuthSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Logs when Google OAuth is not fully configured. Real sign-in is disabled in that case so
 * users are not sent to Google with invalid client IDs ({@code invalid_client}).
 */
@Component
@Profile("!test")
public class GoogleOAuthPlaceholderWarning implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthPlaceholderWarning.class);

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        if (GoogleOAuthSupport.isConfigured(env)) {
            return;
        }
        log.info(oauthBanner(
                "Google OAuth redirect is disabled until you set valid GOOGLE_OAUTH_CLIENT_ID and "
                        + "GOOGLE_OAUTH_CLIENT_SECRET (or application-local.yml). "
                        + "Use email/password login or /mock-google-login. "
                        + "See application-local.yml.example."
        ));
    }

    private static String oauthBanner(String detail) {
        return """

                ========== Google Sign-In will not work ==========
                %s
                Redirect URI to register: http://localhost:8081/login/oauth2/code/google
                (add http://127.0.0.1:8081/login/oauth2/code/google if you use 127.0.0.1)
                ==================================================
                """.formatted(detail);
    }
}
