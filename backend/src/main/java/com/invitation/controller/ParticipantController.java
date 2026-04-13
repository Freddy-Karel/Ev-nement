package com.invitation.controller;

import com.invitation.dto.request.InviteRequest;
import com.invitation.dto.response.InvitationResponse;
import com.invitation.dto.response.ParticipantResponse;
import com.invitation.model.enums.ParticipantStatus;
import com.invitation.service.ParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des participants (réservé à l'admin).
 *
 * <p>Gère les deux flux principaux :</p>
 * <ul>
 *   <li>Invitation nominative : {@code POST /api/events/{eventId}/invite}</li>
 *   <li>Tableau de bord admin : listes INVITED / PENDING / CONFIRMED + actions</li>
 * </ul>
 *
 * <p>Tous les endpoints sont protégés par JWT.</p>
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class ParticipantController {

    private final ParticipantService participantService;

    // =========================================================================
    // INVITATION NOMINATIVE
    // =========================================================================

    /**
     * Crée une invitation nominative pour un événement.
     * Génère un token, construit les données de carte et simule l'envoi email.
     *
     * @param eventId identifiant de l'événement
     * @param request prénom, email, téléphone de l'invité
     * @return {@code 201 Created} avec {@link InvitationResponse} (données pour la carte)
     *         ou {@code 404} si l'événement n'existe pas
     *         ou {@code 409} si l'email est déjà enregistré pour cet événement
     */
    @PostMapping("/api/events/{eventId}/invite")
    public ResponseEntity<InvitationResponse> inviteParticipant(
            @PathVariable Long eventId,
            @Valid @RequestBody InviteRequest request
    ) {
        log.info("POST /api/events/{}/invite — invité : {}", eventId, request.getEmail());
        InvitationResponse response = participantService.inviteParticipant(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // =========================================================================
    // LISTES TABLEAU DE BORD (admin)
    // =========================================================================

    /**
     * Liste les participants confirmés d'un événement (statut {@code CONFIRMED}).
     *
     * @param eventId identifiant de l'événement
     * @return {@code 200 OK} avec la liste des {@link ParticipantResponse}
     */
    @GetMapping("/api/participants/confirmed/{eventId}")
    public ResponseEntity<List<ParticipantResponse>> getConfirmedParticipants(
            @PathVariable Long eventId
    ) {
        log.debug("GET /api/participants/confirmed/{}", eventId);
        return ResponseEntity.ok(participantService.getConfirmedParticipants(eventId));
    }

    /**
     * Liste les inscriptions publiques en attente de validation (statut {@code PENDING}).
     *
     * @param eventId identifiant de l'événement
     * @return {@code 200 OK} avec la liste des {@link ParticipantResponse}
     */
    @GetMapping("/api/participants/pending/{eventId}")
    public ResponseEntity<List<ParticipantResponse>> getPendingParticipants(
            @PathVariable Long eventId
    ) {
        log.debug("GET /api/participants/pending/{}", eventId);
        return ResponseEntity.ok(participantService.getPendingParticipants(eventId));
    }

    /**
     * Liste les invités nominatifs n'ayant pas encore confirmé (statut {@code INVITED}).
     *
     * @param eventId identifiant de l'événement
     * @return {@code 200 OK} avec la liste des {@link ParticipantResponse}
     */
    @GetMapping("/api/participants/invited/{eventId}")
    public ResponseEntity<List<ParticipantResponse>> getInvitedNotConfirmed(
            @PathVariable Long eventId
    ) {
        log.debug("GET /api/participants/invited/{}", eventId);
        return ResponseEntity.ok(participantService.getInvitedNotConfirmed(eventId));
    }

    // =========================================================================
    // ACTIONS ADMIN (validation / refus / renvoi)
    // =========================================================================

    /**
     * Valide une inscription publique : {@code PENDING} → {@code CONFIRMED}.
     * Envoie un email de confirmation au participant.
     *
     * @param participantId identifiant du participant
     * @return {@code 200 OK} avec le {@link ParticipantResponse} mis à jour
     *         ou {@code 404} si le participant n'existe pas
     *         ou {@code 400} si le statut ne permet pas la validation
     */
    @PutMapping("/api/participants/{participantId}/validate")
    public ResponseEntity<ParticipantResponse> validateParticipant(
            @PathVariable Long participantId
    ) {
        log.info("PUT /api/participants/{}/validate", participantId);
        return ResponseEntity.ok(participantService.validateParticipant(participantId));
    }

    /**
     * Refuse une inscription publique : {@code PENDING} → {@code REJECTED}.
     * Envoie un email de refus au participant.
     *
     * @param participantId identifiant du participant
     * @return {@code 200 OK} avec le {@link ParticipantResponse} mis à jour
     *         ou {@code 404} si le participant n'existe pas
     *         ou {@code 400} si le statut ne permet pas le refus
     */
    @PutMapping("/api/participants/{participantId}/reject")
    public ResponseEntity<ParticipantResponse> rejectParticipant(
            @PathVariable Long participantId
    ) {
        log.info("PUT /api/participants/{}/reject", participantId);
        return ResponseEntity.ok(participantService.rejectParticipant(participantId));
    }

    /**
     * Renvoie l'invitation à un invité nominatif qui n'a pas encore confirmé.
     * Retourne les données complètes pour régénérer la carte côté frontend.
     *
     * @param participantId identifiant du participant
     * @return {@code 200 OK} avec l'{@link InvitationResponse}
     *         ou {@code 404} si le participant n'existe pas
     *         ou {@code 400} si le participant n'est pas en statut {@code INVITED}
     */
    @PostMapping("/api/participants/{participantId}/resend-invite")
    public ResponseEntity<InvitationResponse> resendInvitation(
            @PathVariable Long participantId
    ) {
        log.info("POST /api/participants/{}/resend-invite", participantId);
        return ResponseEntity.ok(participantService.resendInvitation(participantId));
    }

    /**
     * Retourne les données de carte d'invitation d'un participant sans renvoi d'email.
     *
     * @param participantId identifiant du participant
     * @return {@code 200 OK} avec l'{@link InvitationResponse}
     */
    @GetMapping("/api/participants/{participantId}/invitation-card")
    public ResponseEntity<InvitationResponse> getInvitationCard(
            @PathVariable Long participantId
    ) {
        log.debug("GET /api/participants/{}/invitation-card", participantId);
        return ResponseEntity.ok(participantService.getInvitationCard(participantId));
    }

    // =========================================================================
    // SUPPRESSION (admin)
    // =========================================================================

    /**
     * Supprime définitivement un participant.
     *
     * @param participantId identifiant du participant
     * @return {@code 204 No Content}
     */
    @DeleteMapping("/api/participants/{participantId}")
    public ResponseEntity<Void> deleteParticipant(@PathVariable Long participantId) {
        log.info("DELETE /api/participants/{}", participantId);
        participantService.deleteParticipant(participantId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // EXPORT CSV
    // =========================================================================

    /**
     * Exporte tous les participants d'un événement au format CSV.
     *
     * <p>Retourne tous les statuts confondus : INVITED, PENDING, CONFIRMED, REJECTED.
     * Le frontend peut filtrer selon ses besoins.</p>
     *
     * @param eventId identifiant de l'événement
     * @return {@code 200 OK} avec la liste complète des {@link ParticipantResponse}
     */
    @GetMapping("/api/participants/export/{eventId}")
    public ResponseEntity<List<ParticipantResponse>> exportParticipants(
            @PathVariable Long eventId
    ) {
        log.info("GET /api/participants/export/{}", eventId);
        // Récupère tous les statuts et les concatène
        List<ParticipantResponse> all = List.of(
                participantService.getConfirmedParticipants(eventId),
                participantService.getPendingParticipants(eventId),
                participantService.getInvitedNotConfirmed(eventId),
                participantService.getParticipantsByStatus(eventId, ParticipantStatus.REJECTED)
        ).stream()
                .flatMap(List::stream)
                .toList();

        return ResponseEntity.ok(all);
    }
}
