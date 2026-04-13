package com.invitation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Réponse à GET /api/ambassador/stats.
 * Contient toutes les informations du tableau de bord d'un ambassadeur.
 */
@Data
@Builder
public class AmbassadorStatsResponse {

    private Long id;
    private String displayName;
    private String avatarUrl;
    private String firstName;
    private String lastName;
    private String email;

    /** Rang actuel : RECRUE, ESTHER, DEBORAH, RUTH, ABIGAIL, KHAYIL */
    private String rank;

    /** Nombre total de personnes invitées via le lien de parrainage. */
    private int invitationCount;

    /** Points cumulés. */
    private int points;

    /** Seuil d'invitations pour atteindre le prochain rang. */
    private int nextRankThreshold;

    /** Seuil d'invitations du rang actuel (pour la barre de progression). */
    private int currentRankThreshold;

    /** Pourcentage de progression vers le prochain rang (0–100). */
    private int progressToNextRank;

    /** Nom du prochain rang. */
    private String nextRankName;

    /** Code de parrainage unique de l'ambassadeur. */
    private String referralCode;

    /** L'ambassadeur a-t-il complété l'onboarding ? */
    private boolean onboardingCompleted;

    /** Mouvement collectif : total des ambassadeurs actifs sur la plateforme. */
    private long totalAmbassadors;

    /** Mouvement collectif : total des inscrits (ambassadeurs + invités). */
    private long totalParticipants;

    /** Liste des personnes invitées par cet ambassadeur. */
    private List<DownlineUser> downline;

    /** Liste des événements auquel l'ambassadeur est inscrit. */
    private List<EventRegistration> events;

    // ── Sous-entités ────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class DownlineUser {
        private Long id;
        private String displayName;
        private String firstName;
        private String avatarUrl;
        private String joinedAt;
    }

    @Data
    @Builder
    public static class EventRegistration {
        private Long eventId;
        private Long participantId;  // ID du Participant en base (pour la carte)
        private String eventTitle;
        private String eventDates;
        private String status;       // PENDING, CONFIRMED, INVITED, REJECTED
    }
}
