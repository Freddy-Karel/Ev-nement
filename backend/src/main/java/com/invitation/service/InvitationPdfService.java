package com.invitation.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.invitation.dto.request.InvitationRequest;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.font.PdfFontFactory.EmbeddingStrategy;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

/**
 * Génération PDF "Concept A" — fond violet immersif, personnalisation par invité(e).
 *
 * <p>Architecture calques (bas → haut) :</p>
 * <ol>
 *   <li>Fond violet + 3 lueurs elliptiques</li>
 *   <li>Médaillon logo (cercle blanc + anneau accent)</li>
 *   <li>Label "ORGANISÉ PAR FEMMES ROYALES"</li>
 *   <li>Badge édition pill</li>
 *   <li>Titre événement 2 lignes</li>
 *   <li>Divider décoratif + losange</li>
 *   <li>Thème en italique</li>
 *   <li>Section invité(e) : icône + NOM en grand + soulignement</li>
 *   <li>Badge date pill blanc</li>
 *   <li>Ligne horaire</li>
 *   <li>Encart LIEU / CONTACT</li>
 *   <li>Code vestimentaire</li>
 *   <li>QR Code (pixels blancs sur fond violet)</li>
 *   <li>Talon détachable bas (fond accent)</li>
 * </ol>
 */
@Service
public class InvitationPdfService {

    // ── Constantes page A4 (points PDF) ──────────────────────────────────────
    private static final float W      = 595.27f;
    private static final float H      = 841.89f;
    private static final float STUB_H = 110f;     // hauteur du talon bas
    private static final float STUB_M = 36f;      // marge gauche/droite du talon
    private static final float LOGO_R = 44f;      // rayon du cercle logo
    private static final float CX     = W / 2f;   // centre horizontal

    // ── Couleurs constantes ───────────────────────────────────────────────────
    private static final DeviceRgb WHITE = new DeviceRgb(1f, 1f, 1f);
    private static final DeviceRgb BLACK = new DeviceRgb(0f, 0f, 0f);
    private static final DeviceRgb BG    = new DeviceRgb(0.17f, 0.02f, 0.27f);

    // =========================================================================
    // POINT D'ENTRÉE PUBLIC
    // =========================================================================

    /**
     * Génère un PDF A4 portrait au format Concept A.
     *
     * @param req      toutes les données de l'invité et de l'événement
     * @param logoFile fichier logo (optionnel — peut être null)
     * @return bytes du PDF généré
     */
    public byte[] generate(InvitationRequest req, MultipartFile logoFile) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
        pdfDoc.setDefaultPageSize(PageSize.A4);
        PdfCanvas c = new PdfCanvas(pdfDoc.addNewPage());

        DeviceRgb accent = hexToRgb(req.getAccentColorHex());

        // Fonts (une instance par document pour éviter tout partage inter-documents)
        PdfFont reg  = PdfFontFactory.createFont(StandardFonts.HELVETICA,
                PdfEncodings.WINANSI, EmbeddingStrategy.PREFER_NOT_EMBEDDED);
        PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD,
                PdfEncodings.WINANSI, EmbeddingStrategy.PREFER_NOT_EMBEDDED);
        PdfFont obl  = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE,
                PdfEncodings.WINANSI, EmbeddingStrategy.PREFER_NOT_EMBEDDED);

        // ── Positions Y (baseline depuis le bas de la page) ──────────────────
        float logoCy  = H - 82f;                 // 759.89 - centre médaillon
        float orgY    = logoCy - LOGO_R - 16f;   // 699.89 - label organisateur
        float badgeCy = orgY - 24f;              // 675.89 - centre badge édition
        float t1Y     = badgeCy - 60f;           // 615.89 - "Business Brunch"
        float t2Y     = t1Y - 43f;               // 572.89 - "Entre femmes"
        float divY    = t2Y - 22f;               // 550.89 - diviseur décoratif
        float themeY  = divY - 22f;              // 528.89 - texte thème
        float iconCy  = themeY - 28f;            // 500.89 - centre icône personne
        float invLblY = iconCy - 16f;            // 484.89 - "INVITATION DE"
        float nameY   = invLblY - 20f;           // 464.89 - nom de l'invité(e)
        float underY  = nameY - 6f;              // 458.89 - soulignement
        float dateCy  = underY - 44f;            // 414.89 - centre badge date
        float dateBtm = dateCy - 20f;            // 394.89 - bas badge date
        float timeY   = dateBtm - 24f;           // 370.89 - ligne horaire
        float boxBtm  = timeY - 72f;             // 298.89 - bas encart infos
        float drsLblY = boxBtm - 18f;            // 280.89 - label code vestim.
        float drsTxtY = drsLblY - 13f;           // 267.89 - texte code vestim.
        float qrSize  = 70f;
        float qrY     = STUB_H + 26f;            // 136f - bas QR code

        // ── Dessin des 14 calques ─────────────────────────────────────────────
        drawBackground(c, accent);
        drawLogo(c, logoFile, accent, logoCy);
        drawOrganiserLabel(c, reg, orgY);
        drawEditionBadge(c, bold, accent, req, badgeCy);
        drawEventTitle(c, bold, obl, req, t1Y, t2Y);
        drawDecorativeDivider(c, accent, divY);
        drawTheme(c, obl, accent, req, themeY);
        drawGuestSection(c, reg, bold, accent, req, iconCy, invLblY, nameY, underY);
        drawDateBadge(c, bold, req, dateCy);
        drawTimeRow(c, reg, req, timeY);
        drawInfoBox(c, reg, bold, accent, req, boxBtm);
        drawDressCode(c, reg, bold, accent, req, drsLblY, drsTxtY);
        drawQRCode(c, reg, req, qrY, qrSize);
        drawStub(c, reg, bold, accent, req);

        pdfDoc.close();
        return baos.toByteArray();
    }

    // =========================================================================
    // 1. FOND
    // =========================================================================
    private void drawBackground(PdfCanvas c, DeviceRgb accent) {
        // Base violet sombre
        c.setFillColor(BG);
        c.rectangle(0, 0, W, H);
        c.fill();

        // Lueur rose/magenta haut-gauche
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.22f));
        c.setFillColor(new DeviceRgb(0.76f, 0f, 0.43f));
        c.ellipse(-80, H * 0.55f, W * 0.65f, H + 100);
        c.fill();
        c.restoreState();

        // Lueur violette centrale
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.18f));
        c.setFillColor(new DeviceRgb(0.55f, 0f, 0.78f));
        c.ellipse(W * 0.2f, H * 0.3f, W * 1.1f, H * 0.95f);
        c.fill();
        c.restoreState();

        // Lueur accent subtile bas-droite
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.06f));
        c.setFillColor(accent);
        c.ellipse(W * 0.4f, -80, W + 100, H * 0.35f);
        c.fill();
        c.restoreState();
    }

    // =========================================================================
    // 2. MÉDAILLON LOGO
    // =========================================================================
    private void drawLogo(PdfCanvas c, MultipartFile logoFile, DeviceRgb accent, float cy) throws Exception {
        // Cercle blanc (fond médaillon)
        c.setFillColor(WHITE);
        c.circle(CX, cy, LOGO_R);
        c.fill();

        // Anneau accent 3pt
        c.saveState();
        c.setStrokeColor(accent);
        c.setLineWidth(3f);
        c.circle(CX, cy, LOGO_R + 4f);
        c.stroke();
        c.restoreState();

        // Anneau extérieur fin 30% opacité
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.30f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(0.8f);
        c.circle(CX, cy, LOGO_R + 9f);
        c.stroke();
        c.restoreState();

        // Image logo (si fournie — fond blanc supprimé)
        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                BufferedImage src = ImageIO.read(logoFile.getInputStream());
                if (src != null) {
                    BufferedImage noWhite = removeWhiteBackground(src);
                    byte[] imgBytes = toImgBytes(noWhite);
                    float sz = LOGO_R * 1.80f;
                    c.addImageFittedIntoRectangle(
                            ImageDataFactory.create(imgBytes),
                            new Rectangle(CX - sz / 2f, cy - sz / 2f, sz, sz),
                            false
                    );
                }
            } catch (Exception e) {
                // Logo optionnel — on continue sans planter
            }
        }
    }

    // =========================================================================
    // 3. LABEL ORGANISATEUR
    // =========================================================================
    private void drawOrganiserLabel(PdfCanvas c, PdfFont reg, float y) throws Exception {
        String label = "ORGANIS\u00C9 PAR  FEMMES ROYALES";
        centeredText(c, reg, 8f, WHITE, 0.60f, label, y);
    }

    // =========================================================================
    // 4. BADGE ÉDITION
    // =========================================================================
    private void drawEditionBadge(PdfCanvas c, PdfFont bold, DeviceRgb accent,
                                   InvitationRequest req, float cy) throws Exception {
        float bw = 148f, bh = 20f, br = 10f;
        float bx = CX - bw / 2f, by = cy - bh / 2f;

        // Fond accent 15% opacité
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.15f));
        c.setFillColor(accent);
        c.roundRectangle(bx, by, bw, bh, br);
        c.fill();
        c.restoreState();

        // Bordure accent 1pt
        c.saveState();
        c.setStrokeColor(accent);
        c.setLineWidth(1f);
        c.roundRectangle(bx, by, bw, bh, br);
        c.stroke();
        c.restoreState();

        // Texte espacé en majuscules
        String txt = "3 \u00C8 M E   \u00C9 D I T I O N";
        centeredText(c, bold, 8.5f, accent, 1f, txt, cy - 2.8f);
    }

    // =========================================================================
    // 5. TITRE ÉVÉNEMENT
    // =========================================================================
    private void drawEventTitle(PdfCanvas c, PdfFont bold, PdfFont obl,
                                 InvitationRequest req, float t1Y, float t2Y) throws Exception {
        String line1 = req.getEventTitleLine1() != null ? req.getEventTitleLine1() : "Business Brunch";
        String line2 = req.getEventTitleLine2() != null ? req.getEventTitleLine2() : "Entre femmes";
        centeredText(c, bold, 46f, WHITE, 1f,    line1, t1Y);
        centeredText(c, obl,  33f, WHITE, 0.92f, line2, t2Y);
    }

    // =========================================================================
    // 6. DIVIDER DÉCORATIF
    // =========================================================================
    private void drawDecorativeDivider(PdfCanvas c, DeviceRgb accent, float y) {
        float margin = 45f, gapInner = 68f, gapAccent = 63f;

        // Ligne gauche blanche 16%
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.16f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(0.8f);
        c.moveTo(margin, y);
        c.lineTo(CX - gapInner, y);
        c.stroke();
        c.restoreState();

        // Ligne accent centrale
        c.saveState();
        c.setStrokeColor(accent);
        c.setLineWidth(1.6f);
        c.moveTo(CX - gapAccent, y);
        c.lineTo(CX + gapAccent, y);
        c.stroke();
        c.restoreState();

        // Ligne droite blanche 16%
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.16f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(0.8f);
        c.moveTo(CX + gapInner, y);
        c.lineTo(W - margin, y);
        c.stroke();
        c.restoreState();

        // Losange ◆ accent au centre
        float d = 4f;
        c.saveState();
        c.setFillColor(accent);
        c.moveTo(CX, y + d);
        c.lineTo(CX + d, y);
        c.lineTo(CX, y - d);
        c.lineTo(CX - d, y);
        c.closePath();
        c.fill();
        c.restoreState();
    }

    // =========================================================================
    // 7. THÈME
    // =========================================================================
    private void drawTheme(PdfCanvas c, PdfFont obl, DeviceRgb accent,
                            InvitationRequest req, float y) throws Exception {
        String theme = req.getTheme() != null ? req.getTheme()
                : "Femme l\u00E8ve-toi et b\u00E2tis ta nation";
        // Guillemets français (WinAnsi 0xAB / 0xBB)
        String display = "\u00AB " + theme + " \u00BB";
        centeredText(c, obl, 12f, accent, 1f, display, y);
    }

    // =========================================================================
    // 8. SECTION INVITÉ(E)
    // =========================================================================
    private void drawGuestSection(PdfCanvas c, PdfFont reg, PdfFont bold, DeviceRgb accent,
                                   InvitationRequest req,
                                   float iconCy, float labelY, float nameY, float underY) throws Exception {
        // ── Icône personne ──
        c.saveState();
        c.setFillColor(accent);
        c.circle(CX, iconCy + 7f, 5f);
        c.fill();
        c.setStrokeColor(accent);
        c.setLineWidth(1.5f);
        c.moveTo(CX - 12f, iconCy - 4f);
        c.curveTo(CX - 5f, iconCy + 2f, CX + 5f, iconCy + 2f, CX + 12f, iconCy - 4f);
        c.stroke();
        c.restoreState();

        // ── "INVITATION DE" ──
        centeredText(c, reg, 8f, WHITE, 0.55f, "INVITATION DE", labelY);

        // ── Nom de l'invité(e) EN GRAND, couleur accent ──
        String guestName = req.getGuestName() != null
                ? req.getGuestName().toUpperCase() : "VOTRE NOM";
        centeredText(c, bold, 22f, accent, 1f, guestName, nameY);

        // ── Soulignement sous le nom ──
        float nameW = bold.getWidth(guestName, 22f);
        c.saveState();
        c.setStrokeColor(accent);
        c.setLineWidth(1f);
        c.moveTo(CX - nameW / 2f - 10f, underY);
        c.lineTo(CX + nameW / 2f + 10f, underY);
        c.stroke();
        c.restoreState();
    }

    // =========================================================================
    // 9. BADGE DATE
    // =========================================================================
    private void drawDateBadge(PdfCanvas c, PdfFont bold, InvitationRequest req, float cy) throws Exception {
        float bw = 295f, bh = 40f, br = 20f;
        float bx = CX - bw / 2f, by = cy - bh / 2f;

        // Fond blanc
        c.setFillColor(WHITE);
        c.roundRectangle(bx, by, bw, bh, br);
        c.fill();

        String dateStr = req.getDate() != null ? req.getDate() : "Samedi 25 Avril 2026";
        DeviceRgb dateColor = new DeviceRgb(0.29f, 0f, 0.44f);

        // Icône calendrier
        float textW  = bold.getWidth(dateStr, 16f);
        float iconX  = CX - textW / 2f - 26f;
        float iconBy = cy - 7f;
        c.saveState();
        c.setStrokeColor(dateColor);
        c.setFillColor(dateColor);
        c.setLineWidth(1f);
        // Corps du calendrier
        c.roundRectangle(iconX, iconBy, 14f, 12f, 1.5f);
        c.stroke();
        // Barre du haut
        c.rectangle(iconX + 0.5f, iconBy + 8f, 13f, 3.5f);
        c.fill();
        // Anneaux de reliure
        c.circle(iconX + 4f, iconBy + 12f, 1.8f);
        c.stroke();
        c.circle(iconX + 10f, iconBy + 12f, 1.8f);
        c.stroke();
        c.restoreState();

        // Texte date
        centeredText(c, bold, 16f, dateColor, 1f, dateStr, cy - 5.5f);
    }

    // =========================================================================
    // 10. LIGNE HORAIRE
    // =========================================================================
    private void drawTimeRow(PdfCanvas c, PdfFont reg, InvitationRequest req, float y) throws Exception {
        String ts    = req.getTimeStart() != null ? req.getTimeStart() : "09h00";
        String te    = req.getTimeEnd()   != null ? req.getTimeEnd()   : "16h30";
        String label = ts + "  \u00B7  " + te;   // · = U+00B7

        float textW  = reg.getWidth(label, 12f);
        float iconW  = 18f;
        float gap    = 7f;
        float totalW = iconW + gap + textW;
        float startX = CX - totalW / 2f;
        float iconCx = startX + iconW / 2f;
        float textX  = startX + iconW + gap;

        // Icône horloge
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.82f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(1f);
        c.circle(iconCx, y + 5f, 7f);
        c.stroke();
        c.moveTo(iconCx, y + 5f);
        c.lineTo(iconCx, y + 10f);
        c.stroke();
        c.moveTo(iconCx, y + 5f);
        c.lineTo(iconCx + 4.5f, y + 5f);
        c.stroke();
        c.restoreState();

        // Texte horaire
        textAt(c, reg, 12f, WHITE, 0.82f, label, textX, y);
    }

    // =========================================================================
    // 11. ENCART LIEU / CONTACT
    // =========================================================================
    private void drawInfoBox(PdfCanvas c, PdfFont reg, PdfFont bold, DeviceRgb accent,
                              InvitationRequest req, float by) throws Exception {
        float bx = 46f, bw = W - 92f, bh = 64f, br = 10f;

        // Fond semi-transparent
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.58f));
        c.setFillColor(new DeviceRgb(0.28f, 0.02f, 0.40f));
        c.roundRectangle(bx, by, bw, bh, br);
        c.fill();
        c.restoreState();

        // Bordure blanc 25%
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.25f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(0.8f);
        c.roundRectangle(bx, by, bw, bh, br);
        c.stroke();
        c.restoreState();

        // Séparateur vertical centré
        float sepX = bx + bw / 2f;
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.20f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(0.8f);
        c.moveTo(sepX, by + 8f);
        c.lineTo(sepX, by + bh - 8f);
        c.stroke();
        c.restoreState();

        float boxCy = by + bh / 2f;    // centre vertical de la box

        // ── COLONNE GAUCHE : LIEU ──────────────────────────────────────────
        String venue = req.getVenueName() != null ? req.getVenueName() : "Le Marial Amissa";
        String city  = req.getVenueCity() != null ? req.getVenueCity() : "Akanda, Libreville";
        float lx = bx + 16f;

        // Icône pin localisation
        float px = lx, py = boxCy - 3f;
        c.saveState();
        c.setFillColor(accent);
        c.circle(px + 4f, py + 7f, 4f);
        c.fill();
        c.moveTo(px, py + 5f);
        c.lineTo(px + 8f, py + 5f);
        c.lineTo(px + 4f, py);
        c.closePath();
        c.fill();
        // Trou du pin (couleur box)
        c.setFillColor(new DeviceRgb(0.28f, 0.02f, 0.40f));
        c.circle(px + 4f, py + 7f, 2f);
        c.fill();
        c.restoreState();

        float tx = lx + 14f;
        textAt(c, bold, 8.5f, accent, 1f,    "LIEU",  tx, boxCy + 14f);
        textAt(c, bold, 12f,  WHITE,  1f,    venue,   tx, boxCy + 3f);
        textAt(c, reg,  10f,  WHITE,  0.78f, city,    tx, boxCy - 9f);

        // ── COLONNE DROITE : CONTACT ──────────────────────────────────────
        String ph1 = req.getPhone1() != null ? req.getPhone1() : "077 46 06 22";
        String ph2 = req.getPhone2() != null ? req.getPhone2() : "066 28 55 93";
        float rx = sepX + 16f;

        // Icône téléphone
        float phx = rx, phy = boxCy - 5f;
        c.saveState();
        c.setStrokeColor(accent);
        c.setLineWidth(1f);
        c.roundRectangle(phx, phy, 8f, 12f, 2f);
        c.stroke();
        c.setFillColor(accent);
        c.circle(phx + 4f, phy + 8f, 2f);
        c.fill();
        c.restoreState();

        float rtx = rx + 14f;
        textAt(c, bold, 8.5f, accent, 1f,    "CONTACT", rtx, boxCy + 14f);
        textAt(c, bold, 12f,  WHITE,  1f,    ph1,       rtx, boxCy + 3f);
        textAt(c, bold, 12f,  WHITE,  1f,    ph2,       rtx, boxCy - 9f);
    }

    // =========================================================================
    // 12. CODE VESTIMENTAIRE
    // =========================================================================
    private void drawDressCode(PdfCanvas c, PdfFont reg, PdfFont bold, DeviceRgb accent,
                                InvitationRequest req, float lblY, float txtY) throws Exception {
        // Icône cintre (accent)
        float labelW = bold.getWidth("CODE VESTIMENTAIRE", 8f);
        float hx = CX - labelW / 2f - 20f;
        float hy = lblY - 2f;

        c.saveState();
        c.setStrokeColor(accent);
        c.setLineWidth(1.1f);
        // Crochet du haut
        c.arc(hx - 2f, hy + 5f, hx + 6f, hy + 11f, 0, 200);
        c.stroke();
        // Pente gauche
        c.moveTo(hx + 2f, hy + 8f);
        c.lineTo(hx - 10f, hy + 1f);
        c.stroke();
        // Pente droite
        c.moveTo(hx + 2f, hy + 8f);
        c.lineTo(hx + 14f, hy + 1f);
        c.stroke();
        // Barre du bas
        c.moveTo(hx - 10f, hy + 1f);
        c.lineTo(hx + 14f, hy + 1f);
        c.stroke();
        c.restoreState();

        centeredText(c, bold, 8f,   accent, 1f,    "CODE VESTIMENTAIRE", lblY);
        String dress = req.getDressCode() != null ? req.getDressCode()
                : "Chic et Class en Jean avec une touche Africaine";
        centeredText(c, reg,  9.5f, WHITE,  0.85f, dress, txtY);
    }

    // =========================================================================
    // 13. QR CODE
    // =========================================================================
    private void drawQRCode(PdfCanvas c, PdfFont reg, InvitationRequest req,
                             float qrY, float qrSize) throws Exception {
        String url = (req.getQrUrl() != null && !req.getQrUrl().isBlank())
                ? req.getQrUrl()
                : "https://femmes-royales.ga/confirm";

        // Génération ZXing
        QRCodeWriter writer = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = Map.of(
                EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                EncodeHintType.MARGIN, 1
        );
        BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, 300, 300, hints);

        // Pixels blancs sur fond transparent (visible sur fond violet)
        BufferedImage qrImg = new BufferedImage(300, 300, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < 300; x++)
            for (int y = 0; y < 300; y++)
                qrImg.setRGB(x, y, matrix.get(x, y) ? 0xFFFFFFFF : 0x00000000);

        // Fond blanc semi-transparent derrière le QR
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.10f));
        c.setFillColor(WHITE);
        c.roundRectangle(CX - qrSize / 2f - 10f, qrY - 10f, qrSize + 20f, qrSize + 20f, 8f);
        c.fill();
        c.restoreState();

        // Image QR
        c.addImageFittedIntoRectangle(
                ImageDataFactory.create(toImgBytes(qrImg)),
                new Rectangle(CX - qrSize / 2f, qrY, qrSize, qrSize),
                false
        );

        // Légende
        centeredText(c, reg, 7f, WHITE, 0.52f, "SCANNER POUR CONFIRMER", qrY - 10f);
    }

    // =========================================================================
    // 14. TALON DÉTACHABLE
    // =========================================================================
    private void drawStub(PdfCanvas c, PdfFont reg, PdfFont bold,
                           DeviceRgb accent, InvitationRequest req) throws Exception {

        // ── Ligne pointillée de découpe ──
        c.saveState();
        c.setExtGState(new PdfExtGState().setStrokeOpacity(0.38f));
        c.setStrokeColor(WHITE);
        c.setLineWidth(0.9f);
        c.setLineDash(5f, 4f, 0f);
        c.moveTo(STUB_M + 20f, STUB_H);
        c.lineTo(W - STUB_M - 20f, STUB_H);
        c.stroke();
        c.restoreState();

        // ── Trous de perforation ──
        for (float hx : new float[]{STUB_M + 20f, W - STUB_M - 20f}) {
            c.saveState();
            c.setFillColor(BG);
            c.circle(hx, STUB_H, 8.5f);
            c.fill();
            c.setExtGState(new PdfExtGState().setStrokeOpacity(0.28f));
            c.setStrokeColor(WHITE);
            c.setLineWidth(0.7f);
            c.circle(hx, STUB_H, 8.5f);
            c.stroke();
            c.restoreState();
        }

        // ── Rectangle fond accent arrondi ──
        float stubH = STUB_H - 18f;   // hauteur du rectangle = 92pt
        c.saveState();
        c.setFillColor(accent);
        c.roundRectangle(STUB_M, 11f, W - 2f * STUB_M, stubH, 9f);
        c.fill();
        c.restoreState();

        // ── Overlay sombre 12% sur la moitié basse (profondeur) ──
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(0.12f));
        c.setFillColor(BLACK);
        c.roundRectangle(STUB_M, 11f, W - 2f * STUB_M, stubH / 2f, 9f);
        c.fill();
        c.restoreState();

        // ── Textes du talon ──
        float stubCy = 11f + stubH / 2f;  // 57pt — centre vertical

        // Colonne gauche : type de billet
        String ticketType = req.getTicketType() != null
                ? req.getTicketType().toUpperCase() : "STANDARD";
        textAt(c, reg,  7.5f, BLACK, 0.72f, "T  I  C  K  E  T", STUB_M + 16f, stubCy + 13f);
        textAt(c, bold, 15f,  BLACK, 1f,    ticketType,          STUB_M + 16f, stubCy - 7f);

        // Colonne centrale : prix
        String price  = req.getTicketPrice() != null ? req.getTicketPrice() : "25 000";
        float  priceW = bold.getWidth(price, 36f);
        textAt(c, bold, 36f,  BLACK, 1f,    price,    CX - priceW / 2f, stubCy - 8f);
        centeredText(c, reg, 9f, BLACK, 0.85f, "F  C  F  A", stubCy - 22f);

        // Colonne droite : infos événement
        String guestName = req.getGuestName()  != null ? req.getGuestName()  : "Invit\u00E9(e)";
        String dateShort = req.getDate()       != null ? req.getDate()       : "25 Avril 2026";
        String venue     = req.getVenueName()  != null ? req.getVenueName()  : "Le Marial Amissa";
        String city      = req.getVenueCity()  != null ? req.getVenueCity()  : "Akanda";
        float  rightEdge = W - STUB_M - 16f;

        textAtRight(c, bold, 8.5f, BLACK, 0.82f, "BUSINESS BRUNCH ENTRE FEMMES", rightEdge, stubCy + 13f);
        textAtRight(c, reg,  8f,   BLACK, 0.68f, guestName + " \u00B7 " + dateShort,        rightEdge, stubCy + 3f);
        textAtRight(c, reg,  7f,   BLACK, 0.55f, venue + ", " + city,                       rightEdge, stubCy - 7f);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================

    /**
     * Affiche du texte à la position (x, y) avec la couleur et l'opacité données.
     */
    private void textAt(PdfCanvas c, PdfFont font, float size, DeviceRgb color,
                        float opacity, String text, float x, float y) throws Exception {
        c.saveState();
        c.setExtGState(new PdfExtGState().setFillOpacity(opacity));
        c.setFillColor(color);
        c.beginText();
        c.setFontAndSize(font, size);
        c.moveText(x, y);
        c.showText(text);
        c.endText();
        c.restoreState();
    }

    /**
     * Affiche du texte aligné à droite se terminant à {@code x}.
     */
    private void textAtRight(PdfCanvas c, PdfFont font, float size, DeviceRgb color,
                              float opacity, String text, float x, float y) throws Exception {
        float tw = font.getWidth(text, size);
        textAt(c, font, size, color, opacity, text, x - tw, y);
    }

    /**
     * Affiche du texte centré horizontalement à la hauteur {@code y}.
     */
    private void centeredText(PdfCanvas c, PdfFont font, float size, DeviceRgb color,
                               float opacity, String text, float y) throws Exception {
        float x = CX - font.getWidth(text, size) / 2f;
        textAt(c, font, size, color, opacity, text, x, y);
    }

    /**
     * Convertit une couleur hexadécimale (#RRGGBB) en {@link DeviceRgb}.
     * Retourne bleu par défaut si la chaîne est nulle ou invalide.
     */
    private DeviceRgb hexToRgb(String hex) {
        if (hex == null || hex.length() < 6) return new DeviceRgb(0.33f, 0.51f, 0.78f);
        String h = hex.replace("#", "");
        if (h.length() < 6) return new DeviceRgb(0.33f, 0.51f, 0.78f);
        try {
            return new DeviceRgb(
                    Integer.parseInt(h.substring(0, 2), 16) / 255f,
                    Integer.parseInt(h.substring(2, 4), 16) / 255f,
                    Integer.parseInt(h.substring(4, 6), 16) / 255f
            );
        } catch (NumberFormatException e) {
            return new DeviceRgb(0.33f, 0.51f, 0.78f);
        }
    }

    /**
     * Supprime le fond blanc d'une image (seuil R, G, B > 228 → transparent).
     */
    private BufferedImage removeWhiteBackground(BufferedImage src) {
        BufferedImage out = new BufferedImage(
                src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < src.getWidth(); x++)
            for (int y = 0; y < src.getHeight(); y++) {
                int rgb = src.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >>  8) & 0xFF;
                int b =  rgb        & 0xFF;
                out.setRGB(x, y,
                        (r > 228 && g > 228 && b > 228)
                                ? 0x00000000
                                : (0xFF000000 | (rgb & 0x00FFFFFF)));
            }
        return out;
    }

    /**
     * Encode un {@link BufferedImage} en bytes PNG.
     */
    private byte[] toImgBytes(BufferedImage img) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }
}
