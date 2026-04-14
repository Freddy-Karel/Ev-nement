package com.invitation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.invitation.dto.request.InvitationRequest;
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
import java.util.Locale;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Contrôleur REST pour la génération de PDF d'invitations — Design Concept A.
 *
 * <p>Endpoints :</p>
 * <ul>
 *   <li>{@code POST /api/invitations/generate}     — un PDF pour un invité/type</li>
 *   <li>{@code POST /api/invitations/generate-all} — ZIP avec PDF VVIP, VIP et STANDARD</li>
 * </ul>
 *
 * <p>Format de requête : {@code multipart/form-data}</p>
 * <ul>
 *   <li>{@code data} (part JSON) — {@link InvitationRequest} sérialisé en JSON</li>
 *   <li>{@code logo} (part fichier, optionnel) — image PNG/JPEG du logo</li>
 * </ul>
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
    // ENDPOINT 1 — PDF unique (un invité, un type de billet)
    // =========================================================================

    /**
     * Génère un PDF d'invitation au format Concept A.
     *
     * @param dataJson JSON de {@link InvitationRequest}
     * @param logo     fichier logo (optionnel)
     * @return {@code 200 OK} avec bytes PDF ({@code application/pdf})
     */
    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateInvitation(
            @RequestPart("data")                               String        dataJson,
            @RequestPart(value = "logo", required = false)     MultipartFile logo
    ) throws Exception {

        InvitationRequest req = objectMapper.readValue(dataJson, InvitationRequest.class);
        log.info("POST /generate — type={}, invité={}", req.getTicketType(), req.getGuestName());

        byte[] pdf = invitationPdfService.generate(req, logo);
        log.info("PDF généré : {} bytes", pdf.length);

        return pdfResponse(pdf, buildFilename(req.getTicketType(), req.getGuestName()));
    }

    // =========================================================================
    // ENDPOINT 2 — ZIP avec les 3 types VVIP / VIP / STANDARD
    // =========================================================================

    /**
     * Génère un ZIP contenant un PDF par type de billet (VVIP, VIP, STANDARD)
     * pour le même invité. Utile pour tester les 3 variantes de design.
     *
     * @param dataJson JSON de {@link InvitationRequest} (ticketType/accentColorHex ignorés)
     * @param logo     fichier logo commun (optionnel)
     * @return {@code 200 OK} avec bytes ZIP ({@code application/zip})
     */
    @PostMapping(value = "/generate-all", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateAll(
            @RequestPart("data")                               String        dataJson,
            @RequestPart(value = "logo", required = false)     MultipartFile logo
    ) throws Exception {

        InvitationRequest base = objectMapper.readValue(dataJson, InvitationRequest.class);
        log.info("POST /generate-all — invité={}", base.getGuestName());

        // Variantes des 3 types
        Map<String, String[]> variants = Map.of(
                "VVIP",     new String[]{"100 000", "#D4A017"},
                "VIP",      new String[]{"50 000",  "#AFAFAF"},
                "STANDARD", new String[]{"25 000",  "#5582C8"}
        );
        String[] typeOrder = {"VVIP", "VIP", "STANDARD"};

        ByteArrayOutputStream zipBaos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(zipBaos)) {
            for (String type : typeOrder) {
                String[] conf = variants.get(type);
                InvitationRequest req = cloneWith(base, type, conf[0], conf[1]);
                byte[] pdf = invitationPdfService.generate(req, logo);
                String entry = sanitize(type) + "_" + sanitize(req.getGuestName()) + ".pdf";
                zip.putNextEntry(new ZipEntry(entry));
                zip.write(pdf);
                zip.closeEntry();
                log.debug("  └─ {} : {} bytes", entry, pdf.length);
            }
        }

        byte[] zipBytes = zipBaos.toByteArray();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/zip"));
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("invitations_concept_a_" + sanitize(base.getGuestName()) + ".zip")
                        .build()
        );
        headers.setContentLength(zipBytes.length);

        log.info("ZIP généré : {} bytes", zipBytes.length);
        return ResponseEntity.ok().headers(headers).body(zipBytes);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /** Clone un InvitationRequest en surchargeant type, prix et couleur. */
    private InvitationRequest cloneWith(InvitationRequest base,
                                         String type, String price, String color) {
        InvitationRequest r = new InvitationRequest();
        r.setEventTitleLine1(base.getEventTitleLine1());
        r.setEventTitleLine2(base.getEventTitleLine2());
        r.setEdition(base.getEdition());
        r.setTheme(base.getTheme());
        r.setDate(base.getDate());
        r.setTimeStart(base.getTimeStart());
        r.setTimeEnd(base.getTimeEnd());
        r.setVenueName(base.getVenueName());
        r.setVenueCity(base.getVenueCity());
        r.setPhone1(base.getPhone1());
        r.setPhone2(base.getPhone2());
        r.setDressCode(base.getDressCode());
        r.setOrganizer(base.getOrganizer());
        r.setQrUrl(base.getQrUrl());
        r.setGuestName(base.getGuestName());
        r.setTicketType(type);
        r.setTicketPrice(price);
        r.setAccentColorHex(color);
        return r;
    }

    private String buildFilename(String ticketType, String guestName) {
        return "invitation_" + sanitize(ticketType) + "_" + sanitize(guestName) + ".pdf";
    }

    private String sanitize(String input) {
        if (input == null || input.isBlank()) return "fichier";
        return input.trim()
                .toLowerCase(Locale.FRENCH)
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(pdf.length);
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
}
