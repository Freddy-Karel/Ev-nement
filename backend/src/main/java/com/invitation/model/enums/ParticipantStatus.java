package com.invitation.model.enums;

/**
 * Statuts possibles d'un participant à un événement.
 *
 * <ul>
 *   <li>{@link #INVITED}   – Invité nominativement par l'admin ; carte générée, email envoyé, confirmation en attente.</li>
 *   <li>{@link #PENDING}   – Inscrit via le formulaire public ; en attente de validation admin.</li>
 *   <li>{@link #CONFIRMED} – Présence confirmée (invité ayant cliqué sur son lien OU inscription validée par l'admin).</li>
 *   <li>{@link #REJECTED}  – Inscription publique refusée par l'admin.</li>
 * </ul>
 */
public enum ParticipantStatus {

    /** Invité nominatif par l'admin, pas encore confirmé. */
    INVITED,

    /** Inscription publique, en attente de validation. */
    PENDING,

    /** Participant officiel (invité confirmé ou inscription validée). */
    CONFIRMED,

    /** Inscription refusée par l'admin. */
    REJECTED
}
