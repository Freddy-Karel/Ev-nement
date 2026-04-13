package com.invitation.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestionnaire centralisé de toutes les exceptions de l'API.
 *
 * <p>{@code @RestControllerAdvice} intercepte les exceptions levées par n'importe
 * quel {@code @RestController} et retourne systématiquement un {@link ErrorResponse}
 * JSON avec le bon status HTTP.</p>
 *
 * <p>Hiérarchie de gestion (du plus spécifique au plus général) :</p>
 * <ol>
 *   <li>Erreurs de validation Bean Validation (400)</li>
 *   <li>Ressource introuvable (404)</li>
 *   <li>Email dupliqué (409)</li>
 *   <li>Mauvais identifiants (401)</li>
 *   <li>Accès interdit (403)</li>
 *   <li>Argument invalide (400)</li>
 *   <li>Contrainte d'intégrité DB (409)</li>
 *   <li>Statut incompatible / état invalide (400)</li>
 *   <li>Toute autre exception (500)</li>
 * </ol>
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // =========================================================================
    // 400 — Erreurs de validation (@Valid sur les DTOs request)
    // =========================================================================

    /**
     * Intercepte les échecs de validation Bean Validation ({@code @Valid}).
     * Collecte tous les champs en erreur dans {@code validationErrors}.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        // Collecte toutes les erreurs champ par champ
        Map<String, String> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() != null
                                ? fieldError.getDefaultMessage()
                                : "Valeur invalide",
                        // En cas de plusieurs erreurs sur le même champ, garde la première
                        (existing, duplicate) -> existing
                ));

        log.warn("Erreur de validation sur {} : {}", request.getRequestURI(), validationErrors);

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Erreurs de validation",
                request.getRequestURI(),
                validationErrors
        );
    }

    // =========================================================================
    // 400 — Argument invalide
    // =========================================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        log.warn("Argument invalide sur {} : {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI(), null);
    }

    // =========================================================================
    // 400 — Statut incompatible (ex : valider un participant non PENDING)
    // =========================================================================

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(
            IllegalStateException ex,
            HttpServletRequest request
    ) {
        log.warn("Opération non autorisée sur {} : {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI(), null);
    }

    // =========================================================================
    // 401 — Mauvais identifiants (login admin)
    // =========================================================================

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex,
            HttpServletRequest request
    ) {
        log.warn("Tentative de connexion échouée sur {}", request.getRequestURI());
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "Email ou mot de passe incorrect",
                request.getRequestURI(),
                null
        );
    }

    // =========================================================================
    // 403 — Accès interdit (JWT présent mais rôle insuffisant)
    // =========================================================================

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        log.warn("Accès refusé sur {} : {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "Accès non autorisé : vous n'avez pas les droits nécessaires",
                request.getRequestURI(),
                null
        );
    }

    // =========================================================================
    // 404 — Ressource introuvable
    // =========================================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        log.warn("Ressource introuvable sur {} : {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI(), null);
    }

    // =========================================================================
    // 409 — Email dupliqué (doublon participant / événement)
    // =========================================================================

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmailException(
            DuplicateEmailException ex,
            HttpServletRequest request
    ) {
        log.warn("Doublon d'email sur {} : {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI(), null);
    }

    // =========================================================================
    // 409 — Violation de contrainte d'intégrité base de données
    // =========================================================================

    /**
     * Intercepte les violations de contraintes MySQL (unique, not null, FK...).
     *
     * <p>Extrait la cause racine pour un message plus précis que le message Hibernate brut.
     * En cas de violation de contrainte unique, retourne un 409 Conflict.</p>
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        String message = extractDataIntegrityMessage(ex);
        log.warn("Violation d'intégrité DB sur {} : {}", request.getRequestURI(), message);
        return buildResponse(HttpStatus.CONFLICT, message, request.getRequestURI(), null);
    }

    // =========================================================================
    // 500 — Erreur inattendue (fallback)
    // =========================================================================

    /**
     * Capture toute exception non gérée explicitement.
     * Logue la stack trace complète pour le débogage, mais retourne un message
     * générique au client (ne jamais exposer les détails techniques en production).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Erreur inattendue sur {} : {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur inattendue est survenue. Veuillez réessayer plus tard.",
                request.getRequestURI(),
                null
        );
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES PRIVÉES
    // =========================================================================

    /**
     * Construit un {@link ResponseEntity} contenant un {@link ErrorResponse} standardisé.
     *
     * @param status           le statut HTTP de la réponse
     * @param message          le message d'erreur lisible
     * @param path             l'URI de la requête en échec
     * @param validationErrors les erreurs de validation champ par champ (peut être {@code null})
     * @return la réponse HTTP complète
     */
    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status,
            String message,
            String path,
            Map<String, String> validationErrors
    ) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(status).body(body);
    }

    /**
     * Extrait un message lisible depuis une {@link DataIntegrityViolationException}.
     *
     * <p>Hibernate encapsule la vraie cause dans la cause racine.
     * On descend jusqu'au message le plus bas de la chaîne pour obtenir
     * l'information MySQL utile (ex : "Duplicate entry 'email@x.com' for key...").</p>
     *
     * @param ex l'exception de violation d'intégrité
     * @return un message utilisateur compréhensible
     */
    private String extractDataIntegrityMessage(DataIntegrityViolationException ex) {
        Throwable rootCause = ex.getRootCause();

        if (rootCause != null && rootCause.getMessage() != null) {
            String rootMsg = rootCause.getMessage();

            if (rootMsg.contains("Data too long for column")) {
                if (rootMsg.contains("banner_url")) {
                    return "L'image de bannière est trop volumineuse pour le schéma actuel. Redémarrez le backend pour appliquer la migration de base de données.";
                }
                return "Une valeur saisie est trop longue pour être enregistrée.";
            }

            // Détecte une violation de clé unique MySQL
            if (rootMsg.contains("Duplicate entry")) {
                if (rootMsg.contains("uk_participant_event_email") || rootMsg.contains("email")) {
                    return "Cet email est déjà enregistré pour cet événement";
                }
                return "Une valeur unique est déjà utilisée dans le système";
            }

            // Détecte une violation de contrainte de clé étrangère
            if (rootMsg.contains("foreign key constraint")) {
                return "Impossible de supprimer cet élément : des données liées existent encore";
            }
        }

        return "Violation d'intégrité des données. Vérifiez les informations saisies.";
    }
}
