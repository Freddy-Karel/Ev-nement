package com.invitation.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO d'invitation nominative créée par l'admin.
 * Utilisé par {@code POST /api/events/{eventId}/invite}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    /** Numéro de téléphone — optionnel. */
    private String phone;
}
