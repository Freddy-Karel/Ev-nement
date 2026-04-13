package com.invitation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Corps de la requête POST /api/ambassador/onboard.
 * Représente les informations de l'étape d'onboarding ambassadeur.
 */
@Data
public class OnboardingRequest {

    @NotBlank(message = "Le pseudo est obligatoire")
    @Pattern(
        regexp = "^[a-zA-Z0-9._]{3,30}$",
        message = "Le pseudo doit contenir 3 à 30 caractères (lettres, chiffres, . ou _)"
    )
    private String displayName;

    /**
     * Image encodée en Base64 (optionnel).
     * Si absent, un avatar SVG avec les initiales sera généré automatiquement.
     */
    private String avatarBase64;
}
