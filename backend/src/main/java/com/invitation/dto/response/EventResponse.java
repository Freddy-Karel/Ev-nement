package com.invitation.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.invitation.dto.EventTicketTypeDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO de réponse représentant un événement.
 * Retourné par les endpoints {@code /api/events}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {

    private Long id;

    private String title;

    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endDate;

    private String location;

    private String bannerUrl;

    /** Programme de l'événement (structure JSON libre — hérité). */
    private Map<String, Object> programme;

    /**
     * Programme horaire : liste de {@code {"time": "09h00", "activity": "Accueil"}}.
     * Utilisé pour la timeline publique.
     */
    private List<Map<String, Object>> program;

    /** Code vestimentaire (ex : "Chic et Class en Jean avec une touche Africaine"). */
    private String dressCode;

    /**
     * Types de billets configurables pour cet événement.
     * Null ou vide = les 3 types par défaut (STANDARD/VIP/VVIP) s'appliquent côté client.
     */
    private List<EventTicketTypeDTO> ticketTypes;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
