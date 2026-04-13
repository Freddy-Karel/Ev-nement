package com.invitation.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée quand un email est déjà enregistré pour le même événement.
 * Spring retournera automatiquement un HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email, Long eventId) {
        super("L'email '" + email + "' est déjà enregistré pour l'événement id=" + eventId);
    }
}
