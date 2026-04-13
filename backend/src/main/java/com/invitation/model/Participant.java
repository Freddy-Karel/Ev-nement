package com.invitation.model;

import com.invitation.model.enums.ParticipantStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité centrale de la plateforme : représente toute personne liée à un événement,
 * qu'elle soit invitée nominativement ou inscrite via le formulaire public.
 *
 * <p>Contrainte d'unicité : un même email ne peut apparaître qu'une fois par événement.</p>
 *
 * <p>Cycle de vie des statuts :</p>
 * <pre>
 *   Invitation admin  → INVITED  → CONFIRMED
 *   Inscription pub.  → PENDING  → CONFIRMED
 *                               → REJECTED
 * </pre>
 */
@Entity
@Table(
    name = "participants",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_participant_event_email",
            columnNames = {"event_id", "email"}
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Événement auquel ce participant est rattaché.
     * Chargement LAZY pour éviter les requêtes inutiles lors des listes.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** Prénom de l'invité ou du participant inscrit. */
    @Column(nullable = false, length = 100)
    private String firstName;

    /** Email – unique par événement (voir contrainte de table). */
    @Column(nullable = false, length = 255)
    private String email;

    /** Numéro de téléphone (optionnel). */
    @Column(length = 50)
    private String phone;

    /**
     * Statut courant du participant.
     * Stocké sous forme de chaîne lisible en base (ex : "INVITED").
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipantStatus status;

    /**
     * Token UUID unique généré pour les invitations nominatives.
     * Utilisé dans le lien de confirmation : /confirm/{token}.
     * {@code null} pour les inscriptions publiques (statut PENDING).
     */
    @Column(unique = true, length = 255)
    private String token;

    /**
     * {@code true} si l'invitation a été créée par l'admin,
     * {@code false} pour une inscription via le formulaire public.
     */
    @Column(nullable = false)
    private boolean invitedByAdmin;

    /** Horodatage de la confirmation (null tant que non confirmé). */
    private LocalDateTime confirmedAt;

    /** Date de création de l'enregistrement, renseignée automatiquement. */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Type de billet choisi à l'inscription.
     * <p>
     * Stocké en tant que chaîne libre (ex : "STANDARD", "VIP", "PREMIUM") pour
     * permettre des types configurables par événement. Les anciennes valeurs
     * ("STANDARD", "VIP", "VVIP") restent valides — rétrocompatibilité garantie.
     * </p>
     * {@code null} pour les invitations admin nominatives (billet non applicable).
     */
    @Column(name = "ticket_type", length = 50)
    private String ticketType;

    /**
     * Prix du billet en F CFA au moment de l'inscription.
     * Conservé à titre historique même si le prix de l'événement change ensuite.
     * {@code null} pour les invitations admin nominatives.
     */
    @Column(name = "ticket_price")
    private Integer ticketPrice;

    /**
     * Positionne {@code createdAt} avant toute insertion en base.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
