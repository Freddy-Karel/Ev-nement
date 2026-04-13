package com.invitation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse représentant un orateur.
 * Retourné par les endpoints {@code /api/speakers/**} et {@code /api/public/events/{id}/speakers}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakerResponse {

    private Long id;

    /** Identifiant de l'événement lié. */
    private Long eventId;

    private String name;

    /** Bibliographie courte. */
    private String bio;

    /** URL ou base64 de la photo. */
    private String photoUrl;

    /** Ordre d'affichage. */
    private Integer displayOrder;
}
