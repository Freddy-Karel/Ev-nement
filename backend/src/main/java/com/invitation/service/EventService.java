package com.invitation.service;

import com.invitation.dto.request.EventRequest;
import com.invitation.dto.request.SpeakerRequest;
import com.invitation.dto.response.EventResponse;
import com.invitation.exception.ResourceNotFoundException;
import com.invitation.model.Event;
import com.invitation.model.Speaker;
import com.invitation.repository.EventRepository;
import com.invitation.repository.ParticipantRepository;
import com.invitation.repository.SpeakerRepository;
import com.invitation.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Service gérant les opérations CRUD sur les événements.
 *
 * <p>Les méthodes de lecture utilisent {@code @Transactional(readOnly = true)}
 * pour indiquer à Hibernate qu'aucune écriture n'est attendue,
 * ce qui permet des optimisations (pas de dirty-checking, snapshot, etc.).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final ParticipantRepository participantRepository;
    private final SpeakerRepository speakerRepository;

    // =========================================================================
    // LECTURE
    // =========================================================================

    /**
     * Retourne tous les événements triés du plus récent au plus ancien.
     *
     * @return liste des événements sous forme de DTOs
     */
    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        log.debug("Récupération de tous les événements");
        return eventRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(DtoMapper::toEventResponse)
                .toList();
    }

    /**
     * Retourne le détail d'un événement par son identifiant.
     *
     * @param id identifiant de l'événement
     * @return le DTO de l'événement
     * @throws ResourceNotFoundException si l'événement n'existe pas
     */
    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        log.debug("Récupération de l'événement id={}", id);
        return DtoMapper.toEventResponse(findEventEntityById(id));
    }

    // =========================================================================
    // CRÉATION
    // =========================================================================

    /**
     * Crée un nouvel événement.
     *
     * @param request les données de l'événement à créer
     * @return le DTO de l'événement créé (avec l'id généré)
     */
    @Transactional
    public EventResponse createEvent(EventRequest request) {
        log.info("Création d'un nouvel événement : '{}'", request.getTitle());

        Event event = Objects.requireNonNull(Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .location(request.getLocation())
                .bannerUrl(request.getBannerUrl())
                .programme(request.getProgramme())
                .program(request.getProgram())
                .dressCode(request.getDressCode())
                .ticketTypes(request.getTicketTypes())
                .build(), "L'événement à créer ne peut pas être null");

        Event saved = Objects.requireNonNull(
                eventRepository.save(event),
                "L'événement sauvegardé ne peut pas être null"
        );
        log.info("Événement créé avec l'id={}", saved.getId());

        // Enregistrer les speakers s'il y en a
        if (request.getRealSpeakers() != null && !request.getRealSpeakers().isEmpty()) {
            for (SpeakerRequest sr : request.getRealSpeakers()) {
                speakerRepository.save(Objects.requireNonNull(Speaker.builder()
                        .event(saved)
                        .name(sr.getName())
                        .bio(sr.getBio())
                        .photoUrl(sr.getPhotoUrl())
                        .displayOrder(sr.getDisplayOrder() != null ? sr.getDisplayOrder() : 0)
                        .build()));
            }
        }

        return DtoMapper.toEventResponse(saved);
    }

    // =========================================================================
    // MISE À JOUR
    // =========================================================================

    /**
     * Met à jour un événement existant.
     * Seuls les champs non-null de la requête sont appliqués.
     *
     * @param id      identifiant de l'événement à modifier
     * @param request les nouvelles données
     * @return le DTO mis à jour
     * @throws ResourceNotFoundException si l'événement n'existe pas
     */
    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request) {
        Long eventId = Objects.requireNonNull(id, "L'identifiant de l'événement est obligatoire");
        log.info("Mise à jour de l'événement id={}", eventId);

        Event event = findEventEntityById(eventId);

        // Mise à jour de tous les champs (PUT sémantique : remplacement complet)
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setLocation(request.getLocation());
        event.setBannerUrl(request.getBannerUrl());
        event.setProgramme(request.getProgramme());
        event.setProgram(request.getProgram());
        event.setDressCode(request.getDressCode());
        event.setTicketTypes(request.getTicketTypes());

        Event updated = Objects.requireNonNull(
                eventRepository.save(event),
                "L'événement mis à jour ne peut pas être null"
        );
        log.info("Événement id={} mis à jour avec succès", eventId);

        // Mettre à jour les speakers
        if (request.getRealSpeakers() != null) {
            speakerRepository.deleteByEventId(eventId); // On supprime les anciens
            for (SpeakerRequest sr : request.getRealSpeakers()) {
                speakerRepository.save(Objects.requireNonNull(Speaker.builder()
                        .event(updated)
                        .name(sr.getName())
                        .bio(sr.getBio())
                        .photoUrl(sr.getPhotoUrl())
                        .displayOrder(sr.getDisplayOrder() != null ? sr.getDisplayOrder() : 0)
                        .build()));
            }
        }

        return DtoMapper.toEventResponse(updated);
    }

    // =========================================================================
    // SUPPRESSION
    // =========================================================================

    /**
     * Supprime un événement par son identifiant.
     *
     * @param id identifiant de l'événement à supprimer
     * @throws ResourceNotFoundException si l'événement n'existe pas
     */
    @Transactional
    public void deleteEvent(Long id) {
        Long eventId = Objects.requireNonNull(id, "L'identifiant de l'événement est obligatoire");
        log.info("Suppression de l'événement id={}", eventId);
        Event event = Objects.requireNonNull(
                findEventEntityById(eventId),
                "L'événement à supprimer ne peut pas être null"
        );
        speakerRepository.deleteByEventId(eventId);
        participantRepository.deleteByEventId(eventId);
        eventRepository.delete(event);
        log.info("Événement id={} supprimé", eventId);
    }

    // =========================================================================
    // USAGE INTERNE (package + services)
    // =========================================================================

    /**
     * Retourne l'entité {@link Event} brute (non mappée en DTO).
     * Utilisée par les autres services ayant besoin de l'entité complète.
     *
     * @param id identifiant de l'événement
     * @return l'entité Event
     * @throws ResourceNotFoundException si l'événement n'existe pas
     */
    @Transactional(readOnly = true)
    public Event findEventEntityById(Long id) {
        Long eventId = Objects.requireNonNull(id, "L'identifiant de l'événement est obligatoire");
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Événement", eventId));
    }
}
