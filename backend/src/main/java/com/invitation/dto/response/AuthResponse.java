package com.invitation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse à l'authentification.
 * Retourné par {@code POST /api/auth/login} et {@code POST /api/auth/register}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /** Token JWT à inclure dans les requêtes suivantes : {@code Authorization: Bearer <token>}. */
    private String token;

    /** Email de l'utilisateur authentifié. */
    private String email;

    /** Rôle de l'utilisateur : ADMIN ou AMBASSADOR. */
    private String role;

    /** Onboarding complété (ambassadeurs uniquement). */
    private boolean onboardingCompleted;

    /** Prénom (pour l'affichage). */
    private String firstName;
}
