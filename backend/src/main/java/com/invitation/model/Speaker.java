package com.invitation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entité représentant un orateur / intervenant d'un événement FEMMES ROYALES.
 *
 * <p>Liée à un {@link Event} via une relation ManyToOne.</p>
 */
@Entity
@Table(name = "speakers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Speaker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Identifiant de l'événement auquel cet orateur est rattaché. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /** Nom complet de l'orateur (ex : "Mme Chantal OBAME"). */
    @Column(nullable = false, length = 200)
    private String name;

    /**
     * Bibliographie courte (ex : "Styliste africaine, Créatrice de mode, Visagiste").
     * Stocké en TEXT pour permettre des descriptions longues.
     */
    @Column(columnDefinition = "TEXT")
    private String bio;

    /**
     * Photo de l'orateur.
     * Peut contenir une URL distante ou une chaîne base64 (LONGTEXT).
     */
    @Column(columnDefinition = "LONGTEXT")
    private String photoUrl;

    /** Position d'affichage dans la liste (ordre croissant). */
    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;
}
