package com.invitation.dto.request;

import lombok.Data;

/**
 * Requête auto-portante pour la génération d'un billet PDF "Concept A".
 * Contient toutes les informations de l'événement + de l'invité(e).
 */
@Data
public class InvitationRequest {

    // ── Informations événement ──
    private String eventTitleLine1;   // ex : "Business Brunch"
    private String eventTitleLine2;   // ex : "Entre femmes"
    private String edition;           // ex : "3ème Édition"
    private String theme;             // ex : "Femme lève-toi et bâtis ta nation"
    private String date;              // ex : "Samedi 25 Avril 2026"
    private String timeStart;         // ex : "09h00"
    private String timeEnd;           // ex : "16h30"
    private String venueName;         // ex : "Le Marial Amissa"
    private String venueCity;         // ex : "Akanda, Libreville"
    private String phone1;            // ex : "077 46 06 22"
    private String phone2;            // ex : "066 28 55 93"
    private String dressCode;         // ex : "Chic et Class en Jean avec une touche Africaine"
    private String organizer;         // ex : "Femmes Royales"

    // ── Informations invité(e) ──
    private String qrUrl;             // URL encodée dans le QR code
    private String guestName;         // ex : "Freddy"

    // ── Informations billet ──
    private String ticketType;        // "VVIP" | "VIP" | "STANDARD"
    private String ticketPrice;       // ex : "100 000" | "50 000" | "25 000"

    // ── Couleur accent selon le type ──
    // VVIP → #D4A017 (or), VIP → #AFAFAF (argent), STANDARD → #5582C8 (bleu)
    private String accentColorHex;
}
