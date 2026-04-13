package com.invitation.service;

import com.invitation.dto.request.SpeakerRequest;
import com.invitation.dto.response.SpeakerResponse;
import com.invitation.exception.ResourceNotFoundException;
import com.invitation.model.Event;
import com.invitation.model.Speaker;
import com.invitation.repository.SpeakerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Service gérant les opérations CRUD sur les orateurs (speakers).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SpeakerService {

    private final SpeakerRepository speakerRepository;
    private final EventService eventService;

    // =========================================================================
    // LECTURE
    // =========================================================================

    /**
     * Retourne la liste des orateurs d'un événement, triés par displayOrder.
     */
    @Transactional(readOnly = true)
    public List<SpeakerResponse> getSpeakersByEvent(Long eventId) {
        log.debug("Récupération des orateurs pour l'événement id={}", eventId);
        return speakerRepository.findByEventIdOrderByDisplayOrderAsc(eventId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Retourne un orateur par son identifiant.
     */
    @Transactional(readOnly = true)
    public SpeakerResponse getSpeakerById(Long id) {
        return toResponse(findById(id));
    }

    // =========================================================================
    // CRÉATION
    // =========================================================================

    /**
     * Crée un nouvel orateur et le rattache à l'événement indiqué.
     */
    @Transactional
    public SpeakerResponse createSpeaker(SpeakerRequest request) {
        Long eventId = Objects.requireNonNull(request.getEventId(), "L'eventId est obligatoire");
        Event event = eventService.findEventEntityById(eventId);

        Speaker speaker = Speaker.builder()
                .event(event)
                .name(request.getName())
                .bio(request.getBio())
                .photoUrl(request.getPhotoUrl())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        Speaker saved = speakerRepository.save(Objects.requireNonNull(speaker));
        log.info("Orateur créé id={} pour l'événement id={}", saved.getId(), eventId);
        return toResponse(saved);
    }

    // =========================================================================
    // MISE À JOUR
    // =========================================================================

    /**
     * Met à jour un orateur existant (PUT sémantique).
     */
    @Transactional
    public SpeakerResponse updateSpeaker(Long id, SpeakerRequest request) {
        Speaker speaker = findById(id);

        speaker.setName(request.getName());
        speaker.setBio(request.getBio());
        speaker.setPhotoUrl(request.getPhotoUrl());
        if (request.getDisplayOrder() != null) {
            speaker.setDisplayOrder(request.getDisplayOrder());
        }

        Speaker updated = speakerRepository.save(Objects.requireNonNull(speaker));
        log.info("Orateur id={} mis à jour", id);
        return toResponse(updated);
    }

    // =========================================================================
    // SUPPRESSION
    // =========================================================================

    /**
     * Supprime un orateur.
     */
    @Transactional
    public void deleteSpeaker(Long id) {
        Speaker speaker = findById(id);
        speakerRepository.delete(Objects.requireNonNull(speaker));
        log.info("Orateur id={} supprimé", id);
    }

    // =========================================================================
    // PRIVÉ
    // =========================================================================

    private Speaker findById(Long id) {
        return speakerRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Orateur", id));
    }

    private SpeakerResponse toResponse(Speaker s) {
        return SpeakerResponse.builder()
                .id(s.getId())
                .eventId(s.getEvent() != null ? s.getEvent().getId() : null)
                .name(s.getName())
                .bio(s.getBio())
                .photoUrl(s.getPhotoUrl())
                .displayOrder(s.getDisplayOrder())
                .build();
    }
}
