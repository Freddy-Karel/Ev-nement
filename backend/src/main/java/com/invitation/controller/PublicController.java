package com.invitation.controller;

import com.invitation.dto.request.PublicRegistrationRequest;
import com.invitation.dto.response.ConfirmationResponse;
import com.invitation.dto.response.EventResponse;
import com.invitation.dto.response.ParticipantResponse;
import com.invitation.dto.response.SpeakerResponse;

import java.util.List;
import com.invitation.service.EventService;
import com.invitation.service.ParticipantService;
import com.invitation.service.SpeakerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur public — aucune authentification requise.
 *
 * <p>Expose les actions accessibles aux visiteurs et invités :</p>
 * <ul>
 *   <li>Inscription publique à un événement ({@code PENDING})</li>
 *   <li>Confirmation de présence via token ({@code INVITED} → {@code CONFIRMED})</li>
 *   <li>Consultation publique des détails d'un événement</li>
 * </ul>
 *
 * <p>Ces routes sont déclarées dans {@code SecurityConfig} via
 * {@code .requestMatchers("/api/public/**").permitAll()}.</p>
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final ParticipantService participantService;
    private final EventService eventService;
    private final SpeakerService speakerService;

    // =========================================================================
    // INSCRIPTION PUBLIQUE
    // =========================================================================

    /**
     * Enregistre une inscription publique soumise par un visiteur.
     *
     * <p>Crée un participant avec le statut {@code PENDING} et simule
     * l'envoi d'un email confirmant la réception de l'inscription.</p>
     *
     * @param eventId identifiant de l'événement
     * @param request prénom, email, téléphone du visiteur
     * @return {@code 201 Created} avec le {@link ParticipantResponse} créé
     *         ou {@code 404} si l'événement n'existe pas
     *         ou {@code 409} si l'email est déjà enregistré pour cet événement
     *         ou {@code 400} si les champs obligatoires sont manquants ou invalides
     */
    @PostMapping("/events/{eventId}/register")
    public ResponseEntity<ParticipantResponse> register(
            @PathVariable Long eventId,
            @Valid @RequestBody PublicRegistrationRequest request
    ) {
        log.info("POST /api/public/events/{}/register — email : {}", eventId, request.getEmail());
        ParticipantResponse response = participantService.registerPublic(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // =========================================================================
    // CONFIRMATION PAR TOKEN
    // =========================================================================

    /**
     * Confirme la présence d'un invité nominatif via son token unique.
     *
     * <p>Ce endpoint est appelé quand l'invité clique sur le lien dans son email
     * ou scanne le QR code de sa carte d'invitation.</p>
     *
     * <p>Transition de statut : {@code INVITED} → {@code CONFIRMED}.</p>
     *
     * @param token le token UUID unique extrait du lien de confirmation
     * @return {@code 200 OK} avec un {@link ConfirmationResponse} personnalisé
     *         ou {@code 404} si le token est inconnu
     *         ou {@code 400} si le token n'est plus valide (statut incompatible)
     */
    @GetMapping("/confirm/{token}")
    public ResponseEntity<ConfirmationResponse> confirmPresence(@PathVariable String token) {
        log.info("GET /api/public/confirm/{}", token);
        ConfirmationResponse response = participantService.confirmByToken(token);
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // LISTE ET DÉTAIL PUBLICS DES ÉVÉNEMENTS
    // =========================================================================

    /**
     * Retourne la liste de tous les événements (triés du plus récent au plus ancien).
     *
     * <p>Utilisé par la page publique d'accueil pour afficher la grille des événements
     * sans authentification.</p>
     *
     * @return {@code 200 OK} avec la liste des {@link EventResponse}
     */
    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getAllPublicEvents() {
        log.debug("GET /api/public/events");
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    /**
     * Retourne les informations publiques d'un événement.
     *
     * <p>Permet au frontend d'afficher les détails de l'événement sur la page
     * d'inscription publique ou la page de confirmation, sans nécessiter de JWT.</p>
     *
     * @param eventId identifiant de l'événement
     * @return {@code 200 OK} avec l'{@link EventResponse}
     *         ou {@code 404} si l'événement n'existe pas
     */
    @GetMapping("/events/{eventId}")
    public ResponseEntity<EventResponse> getPublicEventDetails(@PathVariable Long eventId) {
        log.debug("GET /api/public/events/{}", eventId);
        return ResponseEntity.ok(eventService.getEventById(eventId));
    }

    // =========================================================================
    // ORATEURS PUBLICS
    // =========================================================================

    /**
     * Retourne la liste des orateurs d'un événement, triés par ordre d'affichage.
     *
     * @param eventId identifiant de l'événement
     * @return {@code 200 OK} avec la liste des {@link SpeakerResponse}
     */
    @GetMapping("/events/{eventId}/speakers")
    public ResponseEntity<List<SpeakerResponse>> getPublicSpeakers(@PathVariable Long eventId) {
        log.debug("GET /api/public/events/{}/speakers", eventId);
        return ResponseEntity.ok(speakerService.getSpeakersByEvent(eventId));
    }
}
