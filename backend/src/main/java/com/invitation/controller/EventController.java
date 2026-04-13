package com.invitation.controller;

import com.invitation.dto.request.EventRequest;
import com.invitation.dto.response.EventResponse;
import com.invitation.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des événements.
 *
 * <p>Tous les endpoints sont protégés : un JWT valide avec le rôle {@code ADMIN}
 * est requis pour toutes les opérations.</p>
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class EventController {

    private final EventService eventService;

    /**
     * Retourne la liste de tous les événements, du plus récent au plus ancien.
     *
     * @return {@code 200 OK} avec la liste des {@link EventResponse}
     */
    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        log.debug("GET /api/events");
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    /**
     * Retourne le détail d'un événement par son identifiant.
     *
     * @param id identifiant de l'événement
     * @return {@code 200 OK} avec l'{@link EventResponse}
     *         ou {@code 404 Not Found} si l'événement n'existe pas
     */
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        log.debug("GET /api/events/{}", id);
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    /**
     * Crée un nouvel événement.
     *
     * @param request les données de l'événement (titre, dates, lieu, programme...)
     * @return {@code 201 Created} avec l'{@link EventResponse} de l'événement créé
     */
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request) {
        log.info("POST /api/events — création : '{}'", request.getTitle());
        EventResponse created = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Met à jour un événement existant (remplacement complet — sémantique PUT).
     *
     * @param id      identifiant de l'événement à modifier
     * @param request les nouvelles données
     * @return {@code 200 OK} avec l'{@link EventResponse} mis à jour
     *         ou {@code 404 Not Found} si l'événement n'existe pas
     */
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request
    ) {
        log.info("PUT /api/events/{} — mise à jour", id);
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    /**
     * Supprime un événement par son identifiant.
     *
     * @param id identifiant de l'événement à supprimer
     * @return {@code 204 No Content} si suppression réussie
     *         ou {@code 404 Not Found} si l'événement n'existe pas
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        log.info("DELETE /api/events/{}", id);
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
