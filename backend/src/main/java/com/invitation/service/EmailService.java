package com.invitation.service;

/**
 * Interface du service d'envoi d'emails.
 *
 * <p>Les emails sont envoyés via Gmail SMTP (spring-boot-starter-mail / JavaMailSender).</p>
 */
public interface EmailService {

    /**
     * Envoie l'email d'invitation nominative avec la carte et le lien de confirmation.
     *
     * @param to              adresse email du destinataire
     * @param firstName       prénom de l'invité (personnalisation)
     * @param eventTitle      titre de l'événement
     * @param confirmationUrl lien de confirmation à cliquer (intégré dans le QR code)
     */
    void sendInvitation(String to, String firstName, String eventTitle, String confirmationUrl);

    /**
     * Envoie l'email de confirmation de réception d'une inscription publique.
     * Informe le visiteur que son inscription est en attente de validation.
     *
     * @param to          adresse email du destinataire
     * @param firstName   prénom du participant
     * @param eventTitle  titre de l'événement
     */
    void sendPendingConfirmation(String to, String firstName, String eventTitle);

    /**
     * Envoie l'email de validation finale après approbation admin.
     * L'inscription PENDING passe à CONFIRMED.
     *
     * @param to          adresse email du destinataire
     * @param firstName   prénom du participant
     * @param eventTitle  titre de l'événement
     */
    void sendValidationConfirmation(String to, String firstName, String eventTitle);

    /**
     * Envoie l'email de refus après rejet de l'inscription par l'admin.
     *
     * @param to          adresse email du destinataire
     * @param firstName   prénom du participant
     * @param eventTitle  titre de l'événement
     */
    void sendRejectionEmail(String to, String firstName, String eventTitle);

    /**
     * Renvoie l'email d'invitation (lien de confirmation) à un invité INVITED.
     *
     * @param to              adresse email du destinataire
     * @param firstName       prénom de l'invité
     * @param eventTitle      titre de l'événement
     * @param confirmationUrl lien de confirmation
     */
    void resendInvitationEmail(String to, String firstName, String eventTitle, String confirmationUrl);

    /**
     * Envoie l'email de bienvenue Ambassadeur avec les identifiants de connexion temporaires.
     *
     * @param to                adresse email du destinataire
     * @param firstName         prénom de l'ambassadeur
     * @param temporaryPassword mot de passe temporaire en clair
     */
    void sendAmbassadorWelcome(String to, String firstName, String temporaryPassword);
}
