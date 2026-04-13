package com.invitation.utils;

import com.invitation.dto.response.EventResponse;
import com.invitation.dto.response.InvitationResponse;
import com.invitation.dto.response.ParticipantResponse;
import com.invitation.model.Event;
import com.invitation.model.Participant;

/**
 * Utilitaire de conversion entre entités JPA et DTOs de réponse.
 *
 * <p>Méthodes statiques — pas d'injection Spring nécessaire.
 * Approche simple et directe adaptée à la démo.</p>
 *
 * <p>Pour un projet en production, envisager MapStruct qui génère
 * le code de mapping à la compilation et évite la maintenance manuelle.</p>
 */
public final class DtoMapper {

    // Classe utilitaire : pas d'instanciation
    private DtoMapper() {}

    // =========================================================================
    // Event → EventResponse
    // =========================================================================

    /**
     * Convertit une entité {@link Event} en {@link EventResponse}.
     *
     * @param event l'entité à convertir
     * @return le DTO de réponse
     */
    public static EventResponse toEventResponse(Event event) {
        if (event == null) return null;

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .location(event.getLocation())
                .bannerUrl(event.getBannerUrl())
                .programme(event.getProgramme())
                .program(event.getProgram())
                .dressCode(event.getDressCode())
                .ticketTypes(event.getTicketTypes())
                .createdAt(event.getCreatedAt())
                .build();
    }

    // =========================================================================
    // Participant → ParticipantResponse
    // =========================================================================

    /**
     * Convertit un {@link Participant} en {@link ParticipantResponse}.
     *
     * <p>Le titre de l'événement est passé explicitement pour éviter
     * un accès LAZY à {@code participant.getEvent().getTitle()}
     * hors contexte de transaction.</p>
     *
     * @param participant le participant à convertir
     * @return le DTO de réponse
     */
    public static ParticipantResponse toParticipantResponse(Participant participant) {
        if (participant == null) return null;

        // Accès sécurisé à l'événement lié (peut être null si LAZY non chargé)
        Long eventId = participant.getEvent() != null ? participant.getEvent().getId() : null;
        String eventTitle = participant.getEvent() != null ? participant.getEvent().getTitle() : null;

        return ParticipantResponse.builder()
                .id(participant.getId())
                .eventId(eventId)
                .eventTitle(eventTitle)
                .firstName(participant.getFirstName())
                .email(participant.getEmail())
                .phone(participant.getPhone())
                .status(participant.getStatus())
                .token(participant.getToken())
                .invitedByAdmin(participant.isInvitedByAdmin())
                .confirmedAt(participant.getConfirmedAt())
                .createdAt(participant.getCreatedAt())
                .ticketType(participant.getTicketType())
                .ticketPrice(participant.getTicketPrice())
                .build();
    }

    // =========================================================================
    // Participant + Event → InvitationResponse
    // =========================================================================

    /**
     * Construit l'{@link InvitationResponse} retourné après création d'une invitation nominative.
     *
     * <p>L'URL de confirmation suit le format : {@code {confirmationBaseUrl}/{token}}.</p>
     *
     * @param participant        le participant INVITED qui vient d'être créé
     * @param event              l'événement associé
     * @param confirmationBaseUrl URL de base pour les liens de confirmation (ex: https://iccc.ga/confirm)
     * @return le DTO complet pour la génération de carte côté frontend
     */
    public static InvitationResponse toInvitationResponse(
            Participant participant,
            Event event,
            String confirmationBaseUrl
    ) {
        String confirmationUrl = confirmationBaseUrl + "/" + participant.getToken();

        return InvitationResponse.builder()
                .participantId(participant.getId())
                .firstName(participant.getFirstName())
                .event(toEventResponse(event))
                .confirmationUrl(confirmationUrl)
                .qrCodeData(confirmationUrl)   // QR code encode la même URL pour la démo
                .status(participant.getStatus())
                .ticketType(participant.getTicketType())
                .build();
    }
}
