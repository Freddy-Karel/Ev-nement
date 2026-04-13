package com.invitation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse à la confirmation de présence d'un invité via son token.
 * Retourné par {@code GET /api/public/confirm/{token}}.
 *
 * <p>Destiné à la page publique de confirmation affichée à l'invité
 * après qu'il ait cliqué sur le lien dans son email.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmationResponse {

    /** {@code true} si la confirmation a réussi. */
    private boolean success;

    /** Identifiant du participant concerné. */
    private Long participantId;

    /** Prénom du participant confirmé. */
    private String participantFirstName;

    /** Message personnalisé affiché à l'invité (ex : "Félicitations Luck, votre présence est confirmée !"). */
    private String message;

    /** Titre de l'événement (ex : "KHAYIL 2026"). */
    private String eventTitle;

    /** Dates de l'événement formatées lisiblement (ex : "du 09 au 12 avril 2026"). */
    private String eventDates;

    /** Lieu de l'événement (pour les boutons calendrier). */
    private String eventLocation;

    /** Date de début ISO-8601 (pour Google Calendar / iCal côté frontend). */
    private String eventStartDate;

    /** Date de fin ISO-8601 (pour Google Calendar / iCal côté frontend). */
    private String eventEndDate;

    /** URL complète de confirmation. */
    private String confirmationUrl;

    /** Valeur à encoder dans le QR code. */
    private String qrCodeData;

    /** Identifiant de l'événement — nécessaire pour charger le détail complet côté frontend. */
    private Long eventId;

    /** Type de billet du participant (ex : "VIP") — nécessaire pour la génération PDF. */
    private String ticketType;
}
