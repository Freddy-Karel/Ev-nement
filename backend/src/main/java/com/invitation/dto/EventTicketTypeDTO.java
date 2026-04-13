package com.invitation.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Représente un type de billet configurable par l'administrateur pour un événement.
 *
 * <p>Stocké en tant qu'élément du tableau JSON {@code ticket_types} dans la colonne
 * {@code ticket_types_config} de la table {@code events}.</p>
 *
 * <p>Exemple JSON en base :</p>
 * <pre>
 * [
 *   { "name": "STANDARD", "price": 25000, "accentColor": "#5582C8",
 *     "description": "Accès à l'événement – Places assises standard",
 *     "icon": "🎟️", "bannerUrl": null },
 *   { "name": "VIP",      "price": 50000, "accentColor": "#AFAFAF",
 *     "description": "Accès VIP – Places prioritaires + goodies",
 *     "icon": "⭐", "bannerUrl": null }
 * ]
 * </pre>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class EventTicketTypeDTO {

    /**
     * Nom du type de billet, affiché sur la carte et stocké dans {@code participants.ticket_type}.
     * Ex : "STANDARD", "VIP", "VVIP", "PREMIUM", "GOLD", etc.
     */
    private String name;

    /**
     * Prix en F CFA (entier).
     * Ex : 25000, 50000, 100000.
     */
    private Integer price;

    /**
     * Couleur d'accent hexadécimale utilisée dans le PDF (anneau logo, stub, QR).
     * Ex : "#5582C8", "#D4A017", "#AFAFAF".
     */
    private String accentColor;

    /**
     * Description courte affichée sur le formulaire d'inscription public.
     * Ex : "Accès VIP – Places prioritaires + goodies".
     */
    private String description;

    /**
     * Emoji ou icône associé au type, affiché dans le formulaire public.
     * Ex : "🎟️", "⭐", "👑".
     */
    private String icon;

    /**
     * URL ou base64 de la bannière spécifique à ce type de billet.
     * Utilisée comme image de couverture dans le PDF généré.
     * {@code null} si ce type partage la bannière principale de l'événement.
     */
    private String bannerUrl;
}
