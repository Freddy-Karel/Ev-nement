package com.invitation.model;

import com.invitation.dto.EventTicketTypeDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Entité représentant un événement FEMMES ROYALES.
 * <p>
 * Les champs {@code programme} et {@code program} sont stockés en colonne JSON MySQL,
 * ce qui permet une structure flexible sans table dédiée.
 */
@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Titre de l'événement (ex : "KHAYIL 2026"). */
    @Column(nullable = false, length = 255)
    private String title;

    /** Description complète ou thème de l'événement. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Date et heure de début. */
    @Column(nullable = false)
    private LocalDateTime startDate;

    /** Date et heure de fin. */
    @Column(nullable = false)
    private LocalDateTime endDate;

    /** Lieu de l'événement (ex : "Gymnase d'Oloumi, Libreville"). */
    @Column(length = 255)
    private String location;

    /** URL de la bannière ou image base64 de couverture. */
    @Column(columnDefinition = "LONGTEXT")
    private String bannerUrl;

    /**
     * Programme de l'événement stocké en JSON.
     * <p>
     * Structure libre, exemple :
     * <pre>
     * {
     *   "plenary": [{"date": "2026-04-09", "time": "17:30-21:30"}],
     *   "workshops": [{"name": "Leadership"}, {"name": "Cellule familiale"}]
     * }
     * </pre>
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> programme;

    /**
     * Programme horaire structuré : liste d'objets {@code {"time": "09h00", "activity": "Accueil"}}.
     * <p>Utilisé pour afficher la timeline sur la page publique.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private List<Map<String, Object>> program;

    /**
     * Code vestimentaire de l'événement.
     * Ex : "Chic et Class en Jean avec une touche Africaine"
     */
    @Column(length = 500)
    private String dressCode;

    /**
     * Configuration des types de billets, stockée en JSON.
     * <p>
     * Chaque élément décrit un type configurable par l'administrateur :
     * nom, prix, couleur d'accent, description, icône, bannière spécifique.
     * </p>
     * <p>
     * Si {@code null} ou vide, le système utilise les 3 types par défaut
     * (STANDARD / VIP / VVIP) pour assurer la rétrocompatibilité.
     * </p>
     * <p>Exemple JSON :</p>
     * <pre>
     * [
     *   {"name":"STANDARD","price":25000,"accentColor":"#5582C8",
     *    "description":"Places assises standard","icon":"🎟️","bannerUrl":null},
     *   {"name":"VIP","price":50000,"accentColor":"#AFAFAF",
     *    "description":"Places prioritaires + goodies","icon":"⭐","bannerUrl":null}
     * ]
     * </pre>
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ticket_types_config", columnDefinition = "JSON")
    private List<EventTicketTypeDTO> ticketTypes;

    /** Date de création de l'événement, renseignée automatiquement. */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Positionne {@code createdAt} avant toute insertion en base.
     * Pas de valeur par défaut côté SQL pour rester portable.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
