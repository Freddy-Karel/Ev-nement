package com.invitation.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de création ou mise à jour d'un orateur.
 * Utilisé par {@code POST /api/speakers} et {@code PUT /api/speakers/{id}}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakerRequest {

    /** Identifiant de l'événement auquel rattacher cet orateur. */
    private Long eventId;

    @NotBlank(message = "Le nom de l'orateur est obligatoire")
    private String name;

    /** Bibliographie courte (optionnelle). */
    private String bio;

    /** URL ou base64 de la photo (optionnelle). */
    private String photoUrl;

    /** Ordre d'affichage (0 = premier). */
    private Integer displayOrder;
}
