package com.invitation.model.enums;

/**
 * Rôles disponibles dans la plateforme.
 * - ADMIN      : Accès complet au back-office (gestion événements, participants)
 * - AMBASSADOR : Espace personnel ambassadeur (dashboard, parrainage, classement)
 */
public enum Role {
    ADMIN,
    AMBASSADOR;

    public boolean isAdmin() {
        return this == ADMIN;
    }

    public boolean isAmbassador() {
        return this == AMBASSADOR;
    }
}
