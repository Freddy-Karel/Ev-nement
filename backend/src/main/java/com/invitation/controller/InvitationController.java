package com.invitation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.WriterException;
import com.invitation.dto.response.EventResponse;
import com.invitation.service.InvitationPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Contrôleur REST pour la génération de PDF d'invitations.
 *
 * <p>Deux endpoints :</p>
 * <ul>
 *   <li>{@code POST /api/invitations/generate} — un PDF pour un type de billet</li>
 *   <li>{@code POST /api/invitations/generate-all} — un ZIP avec un PDF par type</li>
 * </ul>
 *
 * <p>Tous les endpoints sont protégés par JWT ({@code isAuthenticated()}).
 * Les fichiers (logo, bannière) sont transmis en {@code multipart/form-data}.</p>
 */
@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class InvitationController {

    private final InvitationPdfService invitationPdfService;
    private final ObjectMapper         objectMapper;

    // =========================================================================
    // ENDPOINT 1 — PDF unique pour un type de billet
    // =========================================================================

    /**
     * Génère un PDF d'invitation pour un type de billet et un invité donnés.
     *
     * <p>Le corps de la requête doit être {@code multipart/form-data} avec :</p>
     * <ul>
     *   <li>{@code event} (part JSON) — {@link EventResponse} sérialisé en JSON</li>
     *   <li>{@code logo} (part fichier, optionnel) — image PNG/JPEG du logo</li>
     *   <li>{@code banner} (part fichier, optionnel) — image PNG/JPEG de bannière</li>
     *   <li>{@code ticketType} (param) — nom du type (ex : "VIP")</li>
     *   <li>{@code participantName} (param) — prénom affiché sur la carte</li>
     *   <li>{@code qrData} (param) — URL encodée dans le QR code</li>
     * </ul>
     *
     * @return {@code 200 OK} avec le PDF en bytes ({@code application/pdf})
     *         ou {@code 400 Bad Request} si le type de billet est invalide
     */
    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateInvitation(
            @RequestPart("event")                              String         eventJson,
            @RequestPart(value = "logo",   required = false)  MultipartFile  logo,
            @RequestPart(value = "banner", required = false)  MultipartFile  banner,
            @RequestParam("ticketType")                        String         ticketTypeName,
            @RequestParam("participantName")                   String         participantName,
            @RequestParam("qrData")                            String         qrData
    ) throws IOException, WriterException {

        log.info("POST /api/invitations/generate — type={}, invité={}", ticketTypeName, participantName);

        EventResponse event = objectMapper.readValue(eventJson, EventResponse.class);
        validateTicketType(event, ticketTypeName);

        byte[] pdf = invitationPdfService.generate(
                event,
                toBytes(logo),
                toBytes(banner),
                ticketTypeName,
                participantName,
                qrData
        );

        log.info("PDF généré : {} bytes — type={}", pdf.length, ticketTypeName);
        return pdfResponse(pdf, buildPdfFilename(ticketTypeName, participantName));
    }

    // =========================================================================
    // ENDPOINT 2 — ZIP avec un PDF par type de billet
    // =========================================================================

    /**
     * Génère un ZIP contenant un PDF par type de billet configuré pour l'événement.
     *
     * <p>Utile pour l'admin qui veut prévisualiser ou distribuer tous les designs
     * d'un coup. Si l'événement n'a pas de {@code ticketTypes} configurés, le fallback
     * rétrocompatible STANDARD / VIP / VVIP est utilisé.</p>
     *
     * <p>Le corps de la requête doit être {@code multipart/form-data} avec :</p>
     * <ul>
     *   <li>{@code event} (part JSON) — {@link EventResponse} sérialisé en JSON</li>
     *   <li>{@code logo} (part fichier, optionnel) — logo commun à tous les PDFs</li>
     *   <li>{@code banner} (part fichier, optionnel) — bannière commune</li>
     *   <li>{@code participantName} (param) — prénom affiché sur toutes les cartes</li>
     *   <li>{@code qrData} (param) — URL QR commune</li>
     * </ul>
     *
     * @return {@code 200 OK} avec le ZIP en bytes ({@code application/zip})
     *         ou {@code 400 Bad Request} si aucun type n'est disponible
     */
    @PostMapping(value = "/generate-all", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateAllInvitations(
            @RequestPart("event")                              String        eventJson,
            @RequestPart(value = "logo",   required = false)  MultipartFile logo,
            @RequestPart(value = "banner", required = false)  MultipartFile banner,
            @RequestParam("participantName")                   String        participantName,
            @RequestParam("qrData")                            String        qrData
    ) throws IOException, WriterException {

        log.info("POST /api/invitations/generate-all — invité={}", participantName);

        EventResponse event       = objectMapper.readValue(eventJson, EventResponse.class);
        byte[]        logoBytes   = toBytes(logo);
        byte[]        bannerBytes = toBytes(banner);

        List<String> typeNames = resolveTicketTypeNames(event);
        if (typeNames.isEmpty()) {
            throw new IllegalArgumentException(
                    "Aucun type de billet disponible pour cet événement. "
                    + "Configurez des types via le formulaire événement.");
        }

        // Construction du ZIP en mémoire
        ByteArrayOutputStream zipBaos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(zipBaos)) {
            for (String typeName : typeNames) {
                byte[] pdf     = invitationPdfService.generate(
                        event, logoBytes, bannerBytes,
                        typeName, participantName, qrData
                );
                String entry = sanitize(typeName) + "_" + sanitize(participantName) + ".pdf";
                zip.putNextEntry(new ZipEntry(entry));
                zip.write(pdf);
                zip.closeEntry();
                log.debug("  └─ entrée ZIP : {} ({} bytes)", entry, pdf.length);
            }
        }

        byte[] zipBytes   = zipBaos.toByteArray();
        String zipFilename = "invitations_"
                + sanitize(event.getTitle() != null ? event.getTitle() : "event")
                + ".zip";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/zip"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(zipFilename).build());
        headers.setContentLength(zipBytes.length);

        log.info("ZIP généré : {} PDFs, {} bytes total", typeNames.size(), zipBytes.length);
        return ResponseEntity.ok().headers(headers).body(zipBytes);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Convertit un {@link MultipartFile} en {@code byte[]}.
     * Retourne {@code null} si le fichier est absent ou vide.
     */
    private byte[] toBytes(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        return file.getBytes();
    }

    /**
     * Valide que {@code ticketTypeName} existe dans {@code event.ticketTypes}.
     * Sans validation si la config est absente (rétrocompatibilité événements anciens).
     *
     * @throws IllegalArgumentException si le type n'est pas dans la config
     */
    private void validateTicketType(EventResponse event, String ticketTypeName) {
        if (event.getTicketTypes() == null || event.getTicketTypes().isEmpty()) return;

        boolean exists = event.getTicketTypes().stream()
                .anyMatch(t -> ticketTypeName.equalsIgnoreCase(t.getName()));

        if (!exists) {
            throw new IllegalArgumentException(
                    "Type de billet '" + ticketTypeName
                    + "' introuvable dans la configuration de cet événement."
            );
        }
    }

    /**
     * Retourne la liste des noms de types depuis {@code event.ticketTypes}.
     * Fallback vers {@code ["STANDARD", "VIP", "VVIP"]} si la config est absente.
     */
    private List<String> resolveTicketTypeNames(EventResponse event) {
        if (event.getTicketTypes() != null && !event.getTicketTypes().isEmpty()) {
            return event.getTicketTypes().stream()
                    .map(t -> t.getName() != null ? t.getName() : "STANDARD")
                    .toList();
        }
        return List.of("STANDARD", "VIP", "VVIP");
    }

    /**
     * Construit le nom du fichier PDF retourné en téléchargement.
     * Exemple : {@code invitation_vip_jean_dupont.pdf}
     */
    private String buildPdfFilename(String ticketTypeName, String participantName) {
        return "invitation_" + sanitize(ticketTypeName) + "_" + sanitize(participantName) + ".pdf";
    }

    /**
     * Nettoie une chaîne pour qu'elle soit utilisable comme nom de fichier.
     * Remplace tout caractère non alphanumérique par {@code _},
     * supprime les underscores consécutifs et en début/fin.
     */
    private String sanitize(String input) {
        if (input == null || input.isBlank()) return "fichier";
        return input.trim()
                .toLowerCase(Locale.FRENCH)
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    /**
     * Construit la {@link ResponseEntity} pour un retour PDF avec les headers appropriés.
     */
    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(pdf.length);
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
