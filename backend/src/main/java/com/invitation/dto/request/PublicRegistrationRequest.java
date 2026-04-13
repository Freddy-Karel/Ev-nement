package com.invitation.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO d'inscription publique soumise par un visiteur.
 * Utilisé par {@code POST /api/public/events/{eventId}/register}.
 *
 * <p>Structure identique à {@link InviteRequest} mais sémantiquement distincte :
 * l'inscription publique crée un participant avec le statut {@code PENDING},
 * en attente de validation admin.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicRegistrationRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    /** Numéro de téléphone — optionnel. */
    private String phone;

    /**
     * Nom du type de billet choisi (ex : "STANDARD", "VIP", "PREMIUM").
     * Si absent, "STANDARD" est utilisé par défaut.
     */
    private String ticketType;
}
