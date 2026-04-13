package com.invitation.dto.request;

import com.invitation.dto.EventTicketTypeDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO de création ou modification d'un événement.
 * Utilisé par {@code POST /api/events} et {@code PUT /api/events/{id}}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRequest {

    @NotBlank(message = "Le titre de l'événement est obligatoire")
    private String title;

    private String description;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDateTime endDate;

    private String location;

    private String bannerUrl;

    /**
     * Programme horaire structuré : liste de {@code {"time": "09h00", "activity": "Accueil"}}.
     */
    private List<Map<String, Object>> program;

    /**
     * Programme libre au format JSON (champ hérité).
     */
    private Map<String, Object> programme;

    /**
     * Code vestimentaire.
     * Ex : "Chic et Class en Jean avec une touche Africaine"
     */
    private String dressCode;

    /**
     * Liste complète des orateurs de l'événement (avec photo, bio, etc.).
     * Remplacera l'ancienne liste dans `programme.speakers`.
     */
    private List<SpeakerRequest> realSpeakers;

    /**
     * Types de billets configurables pour cet événement.
     * Si null ou vide, les 3 types par défaut (STANDARD/VIP/VVIP) seront utilisés.
     */
    private List<EventTicketTypeDTO> ticketTypes;
}
