package com.invitation.model;

import com.invitation.model.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un utilisateur de la plateforme.
 *
 * <p>Deux types d'utilisateurs :</p>
 * <ul>
 *   <li>{@link Role#ADMIN}      : administrateur back-office (géré par AdminInitializer)</li>
 *   <li>{@link Role#AMBASSADOR} : participant avec espace personnel, créé lors de l'inscription publique</li>
 * </ul>
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Email de connexion – doit être unique dans le système. */
    @Column(unique = true, nullable = false, length = 255)
    private String email;

    /** Mot de passe BCrypt (jamais stocké en clair). */
    @Column(nullable = false, length = 255)
    private String password;

    // =========================================================================
    // IDENTITÉ
    // =========================================================================

    @Column(length = 100)
    private String firstName;

    @Column(length = 100)
    private String lastName;

    // =========================================================================
    // RÔLE
    // =========================================================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.ADMIN;

    // =========================================================================
    // CHAMPS AMBASSADEUR
    // =========================================================================

    /** Pseudo unique visible (ex : leonardo.wall40). */
    @Column(unique = true, length = 100)
    private String displayName;

    /** URL ou Base64 de la photo de profil. Null = avatar SVG par défaut. */
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;

    /**
     * Code de parrainage unique de l'ambassadeur.
     * Utilisé dans le lien : /register?ref={referralCode}
     */
    @Column(unique = true, length = 100)
    private String referralCode;

    /**
     * Ambassadeur qui a invité cet utilisateur.
     * null pour les inscriptions directes et les admins.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id")
    private User referrer;

    /** Liste des utilisateurs parrainés par cet ambassadeur. */
    @OneToMany(mappedBy = "referrer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<User> referrals = new ArrayList<>();

    /** Nombre total de personnes invitées via le lien de parrainage. */
    @Column(nullable = false)
    @Builder.Default
    private int invitationCount = 0;

    /** Points cumulés (10 pts par invitation confirmée). */
    @Column(nullable = false)
    @Builder.Default
    private int points = 0;

    /**
     * Rang actuel de l'ambassadeur.
     * Progression : RECRUE → ESTHER (5) → DEBORAH (15) → RUTH (25) → ABIGAIL (50) → KHAYIL (75)
     */
    @Column(name = "ambassador_rank", length = 50)
    @Builder.Default
    private String rank = "RECRUE";

    /** Indique si l'ambassadeur a complété l'onboarding (pseudo + avatar). */
    @Column(nullable = false)
    @Builder.Default
    private boolean onboardingCompleted = false;

    // =========================================================================
    // RÉINITIALISATION DE MOT DE PASSE
    // =========================================================================

    /** Token sécurisé envoyé par email pour réinitialiser le mot de passe. */
    @Column(length = 128)
    private String passwordResetToken;

    /** Date d'expiration du token de réinitialisation (1 heure après génération). */
    private LocalDateTime passwordResetTokenExpiry;

    // =========================================================================
    // AUDIT
    // =========================================================================

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        // Génération automatique du code de parrainage à la création
        if (this.referralCode == null && this.role == Role.AMBASSADOR) {
            this.referralCode = generateReferralCode();
        }
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /** Calcule le rang en fonction du nombre d'invitations. */
    public String computeRank() {
        if (invitationCount >= 75) return "KHAYIL";
        if (invitationCount >= 50) return "ABIGAIL";
        if (invitationCount >= 25) return "RUTH";
        if (invitationCount >= 15) return "DEBORAH";
        if (invitationCount >= 5)  return "ESTHER";
        return "RECRUE";
    }

    /** Génère un code de parrainage à partir de l'email (unique par construction). */
    private String generateReferralCode() {
        String base = email.split("@")[0]
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "")
                .substring(0, Math.min(8, email.split("@")[0].length()));
        return base + "_" + Long.toHexString(System.currentTimeMillis()).toUpperCase().substring(0, 6);
    }
}
