package com.invitation.controller;

import com.invitation.dto.request.SpeakerRequest;
import com.invitation.dto.response.SpeakerResponse;
import com.invitation.service.SpeakerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des orateurs.
 *
 * <ul>
 *   <li>Lecture publique : {@code GET /api/public/events/{eventId}/speakers} (via PublicController)</li>
 *   <li>CRUD admin : {@code /api/speakers/**} — JWT requis</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/speakers")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class SpeakerController {

    private final SpeakerService speakerService;

    /** Liste les orateurs d'un événement. */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SpeakerResponse>> getByEvent(@PathVariable Long eventId) {
        log.debug("GET /api/speakers/event/{}", eventId);
        return ResponseEntity.ok(speakerService.getSpeakersByEvent(eventId));
    }

    /** Détail d'un orateur. */
    @GetMapping("/{id}")
    public ResponseEntity<SpeakerResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(speakerService.getSpeakerById(id));
    }

    /** Crée un orateur. */
    @PostMapping
    public ResponseEntity<SpeakerResponse> create(@Valid @RequestBody SpeakerRequest request) {
        log.info("POST /api/speakers — nom : '{}'", request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(speakerService.createSpeaker(request));
    }

    /** Met à jour un orateur. */
    @PutMapping("/{id}")
    public ResponseEntity<SpeakerResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SpeakerRequest request
    ) {
        log.info("PUT /api/speakers/{}", id);
        return ResponseEntity.ok(speakerService.updateSpeaker(id, request));
    }

    /** Supprime un orateur. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/speakers/{}", id);
        speakerService.deleteSpeaker(id);
        return ResponseEntity.noContent().build();
    }
}
