package com.invitation.dto.response;

import com.invitation.model.enums.ParticipantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse après création d'une invitation nominative.
 * Retourné par {@code POST /api/events/{eventId}/invite}.
 *
 * <p>Contient toutes les données nécessaires au frontend pour générer
 * la carte d'invitation (PDF via @react-pdf/renderer) :</p>
 * <ul>
 *   <li>Prénom de l'invité</li>
 *   <li>Détails complets de l'événement</li>
 *   <li>URL de confirmation (intégrée dans le QR code)</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

    /** Identifiant du participant créé en base. */
    private Long participantId;

    /** Prénom de l'invité — affiché sur la carte. */
    private String firstName;

    /** Détails complets de l'événement pour la carte d'invitation. */
    private EventResponse event;

    /**
     * URL complète de confirmation.
     * Format : {@code https://iccc.ga/confirm/{token}}
     * Intégrée dans le QR code et le lien email.
     */
    private String confirmationUrl;

    /**
     * Données encodées dans le QR code.
     * Pour la démo : identique à {@code confirmationUrl}.
     * En production, pourrait inclure des métadonnées supplémentaires.
     */
    private String qrCodeData;

    /** Statut du participant au moment de la création (toujours {@code INVITED}). */
    private ParticipantStatus status;

    /**
     * Type de billet du participant (ex : "STANDARD", "VIP", "PREMIUM").
     * {@code null} pour les invitations nominatives admin sans type défini.
     */
    private String ticketType;
}
