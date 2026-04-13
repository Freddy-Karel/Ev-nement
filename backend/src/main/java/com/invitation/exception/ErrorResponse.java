package com.invitation.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO standard pour toutes les réponses d'erreur de l'API.
 *
 * <p>Structure cohérente quel que soit le type d'erreur, facilitant
 * la gestion des erreurs côté frontend.</p>
 *
 * <p>{@code @JsonInclude(NON_NULL)} évite d'inclure {@code validationErrors}
 * dans la réponse quand il n'y a pas d'erreurs de validation.</p>
 *
 * <p>Exemple de réponse 400 avec erreurs de validation :</p>
 * <pre>
 * {
 *   "timestamp": "2026-04-09T17:30:00",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Erreurs de validation",
 *   "path": "/api/events",
 *   "validationErrors": {
 *     "title": "Le titre de l'événement est obligatoire",
 *     "startDate": "La date de début est obligatoire"
 *   }
 * }
 * </pre>
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    /** Horodatage de l'erreur. */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    /** Code HTTP numérique (ex : 400, 404, 409). */
    private int status;

    /** Libellé HTTP de l'erreur (ex : "Bad Request", "Not Found"). */
    private String error;

    /** Message d'erreur lisible, en français. */
    private String message;

    /** Chemin de la requête ayant échoué (ex : "/api/events"). */
    private String path;

    /**
     * Détail des erreurs de validation champ par champ.
     * {@code null} pour les erreurs non liées à la validation.
     * Clé = nom du champ, Valeur = message d'erreur.
     */
    private Map<String, String> validationErrors;
}
