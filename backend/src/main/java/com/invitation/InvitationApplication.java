package com.invitation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée principal de la plateforme d'invitation.
 * <p>
 * Plateforme de gestion d'invitations et d'inscriptions pour événements.
 * Charte graphique inspirée de KHAYIL 2026 – ICC Gabon.
 */
@SpringBootApplication
public class InvitationApplication {

    public static void main(String[] args) {
        SpringApplication.run(InvitationApplication.class, args);
    }
}
