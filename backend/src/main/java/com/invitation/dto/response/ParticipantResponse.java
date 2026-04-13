package com.invitation.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.invitation.model.enums.ParticipantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse représentant un participant à un événement.
 * Retourné par les endpoints {@code /api/participants/**}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {

    private Long id;

    /** Identifiant de l'événement lié (évite de sérialiser l'entité Event entière). */
    private Long eventId;

    /** Titre de l'événement — dénormalisé pour l'affichage dans les listes. */
    private String eventTitle;

    private String firstName;

    private String email;

    private String phone;

    /** Statut courant : INVITED, PENDING, CONFIRMED ou REJECTED. */
    private ParticipantStatus status;

    /**
     * Token de confirmation (uniquement pour les invités nominatifs).
     * {@code null} pour les inscriptions publiques.
     */
    private String token;

    /** {@code true} si créé par l'admin, {@code false} si inscription publique. */
    private boolean invitedByAdmin;

    /** Date de confirmation — {@code null} tant que non confirmé. */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime confirmedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    /** Type de billet (ex : "STANDARD", "VIP", "PREMIUM") — null pour les invitations admin. */
    private String ticketType;

    /** Prix du billet en F CFA au moment de l'inscription — null pour les invitations admin. */
    private Integer ticketPrice;
}
