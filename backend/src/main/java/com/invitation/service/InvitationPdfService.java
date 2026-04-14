package com.invitation.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.invitation.dto.EventTicketTypeDTO;
import com.invitation.dto.response.EventResponse;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import com.itextpdf.kernel.pdf.xobject.PdfImageXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Génération PDF "Affiche Immersive" pleine page A4 via iText7 {@link PdfCanvas}.
 *
 * <p>Architecture calques (bas → haut) :</p>
 * <ol>
 *   <li>Fond sombre BG_DARK (pleine page)</li>
 *   <li>Bannière pleine page floutée (Gaussian blur 3 passes) + dégradé 40 bandes power 1.8</li>
 *   <li>Médaillon logo en haut au centre (double anneau accent + disque blanc + logo transparent)</li>
 *   <li>Label "ORGANISÉ PAR FEMMES ROYALES" sous le médaillon</li>
 *   <li>Panneau glassmorphisme info (y=95 → y=425) : zone titre / zone infos / zone invité</li>
 *   <li>QR code centré (y=118, 70×70 pt)</li>
 *   <li>Talon 3 colonnes (y=0 → y=95)</li>
 * </ol>
 *
 * <p>Coordonnées iText7 : origine (0,0) en BAS-GAUCHE, Y croissant vers le haut.</p>
 */
@Service
public class InvitationPdfService {

    // =========================================================================
    // POLICES
    // =========================================================================
    private static final String FONT_REGULAR_PATH = "fonts/PlayfairDisplay-Regular.ttf";
    private static final String FONT_BOLD_PATH    = "fonts/PlayfairDisplay-Bold.ttf";
    private static final String FONT_ITALIC_PATH  = "fonts/PlayfairDisplay-Italic.ttf";

    private volatile PdfFont fontRegular;
    private volatile PdfFont fontBold;
    private volatile PdfFont fontItalic;

    // =========================================================================
    // GÉOMÉTRIE A4
    // =========================================================================
    private static final float PAGE_W = PageSize.A4.getWidth();   // 595.27 pt
    private static final float PAGE_H = PageSize.A4.getHeight();  // 841.89 pt

    /** Médaillon logo centré en haut. */
    private static final float LOGO_CX    = PAGE_W / 2f;   // 297.6 pt
    private static final float LOGO_CY    = PAGE_H - 59f;  // ≈ 782.9 pt
    private static final float LOGO_R     = 40f;            // rayon disque blanc
    private static final float LOGO_RING  = 43.5f;          // anneau intérieur accent
    private static final float LOGO_RING2 = 48f;            // anneau extérieur accent

    /** Panneau info glassmorphisme. */
    private static final float INFO_TOP   = 425f;
    private static final float INFO_LEFT  = 40f;
    private static final float INFO_RIGHT = PAGE_W - 40f;
    private static final float INFO_W     = INFO_RIGHT - INFO_LEFT;  // 515.27 pt

    /** QR code (centré horizontalement). */
    private static final float QR_SIZE = 70f;
    private static final float QR_X    = PAGE_W / 2f - QR_SIZE / 2f;  // ≈ 262.6 pt
    private static final float QR_Y    = 118f;

    /** Talon détachable. */
    private static final float STUB_HEIGHT = 95f;
    private static final float STUB_BAR_W  = 8f;

    // =========================================================================
    // PALETTE
    // =========================================================================
    private static final DeviceRgb BG_DARK    = rgb( 14,   0,  32);
    private static final DeviceRgb BG_OVERLAY = rgb(  0,   0,  15);
    private static final DeviceRgb WHITE      = rgb(255, 255, 255);
    private static final DeviceRgb GOLD       = rgb(212, 160,  23);
    private static final DeviceRgb LAVENDER   = rgb(200, 180, 220);

    // =========================================================================
    // POINT D'ENTRÉE
    // =========================================================================

    public byte[] generate(
            EventResponse event,
            byte[] logoBytes,
            byte[] bannerBytes,
            String ticketTypeName,
            String participantName,
            String qrData
    ) throws IOException, WriterException {

        DeviceRgb accent = resolveAccentColor(event, ticketTypeName);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos))) {
            pdfDoc.addNewPage(new PageSize(PAGE_W, PAGE_H));
            PdfPage   page   = pdfDoc.getFirstPage();
            PdfCanvas canvas = new PdfCanvas(page);

            drawBackground(canvas);
            drawFullPagePoster(canvas, bannerBytes);
            drawLogoMedallion(canvas, logoBytes, accent);
            drawOrganiseLabel(canvas);
            drawInfoOverlay(canvas, event, participantName, accent);
            if (qrData != null && !qrData.isBlank()) {
                drawQRCode(canvas, qrData);
            }
            drawStub(canvas, event, participantName, ticketTypeName, accent);

            canvas.release();
        }
        return baos.toByteArray();
    }

    // =========================================================================
    // 1. FOND SOMBRE
    // =========================================================================

    private void drawBackground(PdfCanvas canvas) {
        canvas.saveState();
        canvas.setFillColor(BG_DARK);
        canvas.rectangle(0, 0, PAGE_W, PAGE_H);
        canvas.fill();
        canvas.restoreState();
    }

    // =========================================================================
    // 2. BANNIÈRE PLEINE PAGE — Gaussian blur + dégradé 40 bandes power 1.8
    // =========================================================================

    private void drawFullPagePoster(PdfCanvas canvas, byte[] bannerBytes) throws IOException {
        if (bannerBytes == null || bannerBytes.length == 0) return;

        byte[] blurred = applyGaussianBlur(bannerBytes);
        PdfImageXObject xObj = new PdfImageXObject(ImageDataFactory.create(blurred));

        canvas.saveState();
        canvas.addXObjectFittedIntoRectangle(xObj, new Rectangle(0, 0, PAGE_W, PAGE_H));
        canvas.restoreState();

        // Dégradé : opacité 85 % en bas (i=0) → 15 % en haut (i=39), courbe power 1.8
        int   bands = 40;
        float bandH = PAGE_H / bands;
        canvas.saveState();
        for (int i = 0; i < bands; i++) {
            float t       = (float) i / (bands - 1);                           // 0=bas, 1=haut
            float opacity = 0.85f - 0.70f * (float) Math.pow(t, 1.8);
            canvas.setExtGState(new PdfExtGState().setFillOpacity(opacity));
            canvas.setFillColor(BG_OVERLAY);
            canvas.rectangle(0, i * bandH, PAGE_W, bandH + 1f);
            canvas.fill();
        }
        canvas.restoreState();
    }

    // =========================================================================
    // 3. MÉDAILLON LOGO
    // =========================================================================

    private void drawLogoMedallion(PdfCanvas canvas, byte[] logoBytes, DeviceRgb accent)
            throws IOException {
        // Anneau extérieur (accent plein)
        canvas.saveState();
        canvas.setFillColor(accent);
        canvas.circle(LOGO_CX, LOGO_CY, LOGO_RING2);
        canvas.fill();

        // Anneau intérieur (blend accent/blanc)
        canvas.setFillColor(blend(accent, WHITE, 0.35f));
        canvas.circle(LOGO_CX, LOGO_CY, LOGO_RING);
        canvas.fill();

        // Disque blanc central
        canvas.setFillColor(WHITE);
        canvas.circle(LOGO_CX, LOGO_CY, LOGO_R);
        canvas.fill();
        canvas.restoreState();

        // Logo clipé dans le disque, fond blanc supprimé
        if (logoBytes != null && logoBytes.length > 0) {
            byte[]         transparent = removeLogoWhiteBg(logoBytes);
            PdfImageXObject logoXObj   = new PdfImageXObject(ImageDataFactory.create(transparent));
            float r = LOGO_R - 2f;
            canvas.saveState();
            canvas.circle(LOGO_CX, LOGO_CY, r);
            canvas.clip();
            canvas.endPath();
            canvas.addXObjectFittedIntoRectangle(logoXObj,
                    new Rectangle(LOGO_CX - r, LOGO_CY - r, r * 2f, r * 2f));
            canvas.restoreState();
        }
    }

    // =========================================================================
    // 4. LABEL ORGANISATEUR
    // =========================================================================

    private void drawOrganiseLabel(PdfCanvas canvas) throws IOException {
        float labelY = LOGO_CY - LOGO_RING2 - 13f;   // ≈ 721 pt
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.70f));
        canvas.setFillColor(WHITE);
        drawCenteredText(canvas, getFontRegular(), "ORGANISÉ PAR FEMMES ROYALES",
                PAGE_W / 2f, labelY, 7.5f);
        canvas.restoreState();
    }

    // =========================================================================
    // 5. PANNEAU INFO GLASSMORPHISME
    //    Zone titre (42 pt haut) / Zone infos (contenu) / Zone invité (30 pt bas)
    // =========================================================================

    private void drawInfoOverlay(PdfCanvas canvas, EventResponse event,
                                  String participantName, DeviceRgb accent) throws IOException {
        PdfFont bold    = getFontBold();
        PdfFont regular = getFontRegular();
        PdfFont italic  = getFontItalic();

        float panelH = INFO_TOP - STUB_HEIGHT;   // 330 pt

        // ── Fond glassmorphisme (panneau entier) ──────────────────────────────
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.15f));
        canvas.setFillColor(WHITE);
        canvas.rectangle(INFO_LEFT, STUB_HEIGHT, INFO_W, panelH);
        canvas.fill();
        canvas.restoreState();

        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setStrokeOpacity(0.18f));
        canvas.setStrokeColor(WHITE);
        canvas.setLineWidth(0.5f);
        canvas.rectangle(INFO_LEFT, STUB_HEIGHT, INFO_W, panelH);
        canvas.stroke();
        canvas.restoreState();

        // ── ZONE TITRE (42 pt en haut du panneau) ────────────────────────────
        float titleZoneH   = 42f;
        float titleZoneBot = INFO_TOP - titleZoneH;   // 383 pt

        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.32f));
        canvas.setFillColor(accent);
        canvas.rectangle(INFO_LEFT, titleZoneBot, INFO_W, titleZoneH);
        canvas.fill();
        canvas.restoreState();

        // Bordure inférieure zone titre
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setStrokeOpacity(0.50f));
        canvas.setStrokeColor(accent);
        canvas.setLineWidth(1f);
        canvas.moveTo(INFO_LEFT, titleZoneBot).lineTo(INFO_RIGHT, titleZoneBot).stroke();
        canvas.restoreState();

        String title   = event.getTitle() != null ? event.getTitle().toUpperCase() : "ÉVÉNEMENT";
        float  titleSz = fitFontSize(title, bold, INFO_W - 28f, 16f, 9f);
        float  titleY  = titleZoneBot + (titleZoneH - titleSz) / 2f + 1f;

        canvas.saveState();
        canvas.setFillColor(WHITE);
        drawCenteredText(canvas, bold, title, PAGE_W / 2f, titleY, titleSz);
        canvas.restoreState();

        // ── ZONE INFOS (description, règle, date, heure, lieu, dress) ─────────
        float cL = INFO_LEFT + 14f;
        float cW = INFO_W - 28f;
        float y  = titleZoneBot - 13f;   // ≈ 370 pt

        // Description (italique, blanc 72 %)
        String desc = event.getDescription() != null
                ? truncate(event.getDescription().trim(), 160) : null;
        if (desc != null && !desc.isBlank() && y > 215f) {
            canvas.saveState();
            canvas.setExtGState(new PdfExtGState().setFillOpacity(0.72f));
            canvas.setFillColor(WHITE);
            float yAfter = drawWrappedText(canvas, italic, desc, cL, y, cW, 8.5f, 12.5f);
            canvas.restoreState();
            y = yAfter - 10f;
        }

        // Ligne décorative ◆
        if (y > 215f) {
            drawDecorativeRule(canvas, accent, y + 3f);
            y -= 14f;
        }

        // Pill date + heure
        if (event.getStartDate() != null && y > 215f) {
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy", Locale.FRENCH);
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH'h'mm");
            String dateStr = event.getStartDate().format(dateFmt);
            String timeStr = event.getStartDate().format(timeFmt);
            if (event.getEndDate() != null) timeStr += " – " + event.getEndDate().format(timeFmt);

            y = drawDatePill(canvas, bold, dateStr, cL, y);
            y -= 8f;

            if (y > 215f) {
                canvas.saveState();
                canvas.setFillColor(LAVENDER);
                canvas.beginText().setFontAndSize(regular, 8.5f)
                      .moveText(cL, y).showText(timeStr).endText();
                canvas.restoreState();
                y -= 16f;
            }
        }

        // Cellule LIEU (pleine largeur)
        if (event.getLocation() != null && !event.getLocation().isBlank() && y > 220f) {
            y = drawInfoCell(canvas, bold, regular, "LIEU", event.getLocation(),
                    cL, y, cW, accent);
            y -= 8f;
        }

        // Dress code
        if (event.getDressCode() != null && !event.getDressCode().isBlank() && y > 215f) {
            canvas.saveState();
            canvas.setFillColor(GOLD);
            canvas.beginText().setFontAndSize(bold, 7.5f)
                  .moveText(cL, y).showText("CODE VESTIMENTAIRE").endText();
            canvas.restoreState();

            float lblW = bold.getWidth("CODE VESTIMENTAIRE ", 7.5f);
            canvas.saveState();
            canvas.setExtGState(new PdfExtGState().setFillOpacity(0.80f));
            canvas.setFillColor(WHITE);
            canvas.beginText().setFontAndSize(italic, 8f)
                  .moveText(cL + lblW, y).showText(truncate(event.getDressCode(), 45)).endText();
            canvas.restoreState();
        }

        // ── ZONE INVITÉ (barre accent + label + prénom) ──────────────────────
        float guestY = QR_Y + QR_SIZE + 10f;   // ≈ 198 pt
        float guestH = 30f;

        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.24f));
        canvas.setFillColor(accent);
        canvas.rectangle(INFO_LEFT, guestY, INFO_W, guestH);
        canvas.fill();
        canvas.restoreState();

        // Séparateur haut zone invité
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setStrokeOpacity(0.40f));
        canvas.setStrokeColor(accent);
        canvas.setLineWidth(0.8f);
        canvas.moveTo(INFO_LEFT, guestY + guestH).lineTo(INFO_RIGHT, guestY + guestH).stroke();
        canvas.restoreState();

        canvas.saveState();
        canvas.setFillColor(LAVENDER);
        canvas.beginText().setFontAndSize(regular, 7f)
              .moveText(cL, guestY + guestH - 11f).showText("INVITÉ(E)").endText();
        canvas.restoreState();

        if (participantName != null && !participantName.isBlank()) {
            String guest  = truncate(participantName, 26);
            float  nameSz = fitFontSize(guest, bold, INFO_W * 0.60f, 13f, 9f);
            canvas.saveState();
            canvas.setFillColor(accent);
            canvas.beginText().setFontAndSize(bold, nameSz)
                  .moveText(cL, guestY + 6f).showText(guest).endText();
            canvas.restoreState();
        }
    }

    // =========================================================================
    // 6. QR CODE — pixels blancs sur fond transparent, centré
    // =========================================================================

    private void drawQRCode(PdfCanvas canvas, String qrData) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);

        BitMatrix matrix = new QRCodeWriter().encode(qrData, BarcodeFormat.QR_CODE, 300, 300, hints);

        BufferedImage qrImg = new BufferedImage(300, 300, BufferedImage.TYPE_INT_ARGB);
        for (int px = 0; px < 300; px++) {
            for (int py = 0; py < 300; py++) {
                qrImg.setRGB(px, py, matrix.get(px, py) ? 0xFFFFFFFF : 0x00000000);
            }
        }
        ByteArrayOutputStream qrBaos = new ByteArrayOutputStream();
        ImageIO.write(qrImg, "PNG", qrBaos);

        PdfImageXObject qrXObj = new PdfImageXObject(ImageDataFactory.create(qrBaos.toByteArray()));
        canvas.saveState();
        canvas.addXObjectFittedIntoRectangle(qrXObj, new Rectangle(QR_X, QR_Y, QR_SIZE, QR_SIZE));
        canvas.restoreState();

        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.55f));
        canvas.setFillColor(WHITE);
        drawCenteredText(canvas, getFontRegular(), "SCANNER POUR CONFIRMER",
                PAGE_W / 2f, QR_Y - 10f, 6.5f);
        canvas.restoreState();
    }

    // =========================================================================
    // 7. TALON 3 COLONNES
    // =========================================================================

    private void drawStub(PdfCanvas canvas, EventResponse event, String participantName,
                          String ticketTypeName, DeviceRgb accent) throws IOException {
        PdfFont bold    = getFontBold();
        PdfFont regular = getFontRegular();

        // Fond accent semi-transparent
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.22f));
        canvas.setFillColor(accent);
        canvas.rectangle(0, 0, PAGE_W, STUB_HEIGHT);
        canvas.fill();
        canvas.restoreState();

        // Barre accent gauche (opaque)
        canvas.saveState();
        canvas.setFillColor(accent);
        canvas.rectangle(0, 0, STUB_BAR_W, STUB_HEIGHT);
        canvas.fill();
        canvas.restoreState();

        // Ligne de séparation
        canvas.saveState();
        canvas.setStrokeColor(accent);
        canvas.setLineWidth(1.2f);
        canvas.moveTo(0, STUB_HEIGHT).lineTo(PAGE_W, STUB_HEIGHT).stroke();
        canvas.restoreState();

        // Trous de perforation
        canvas.saveState();
        canvas.setFillColor(BG_DARK);
        for (float hx : new float[]{18f, PAGE_W / 2f, PAGE_W - 18f}) {
            canvas.circle(hx, STUB_HEIGHT, 5f);
            canvas.fill();
        }
        canvas.restoreState();

        // Séparateurs verticaux colonnes
        float col1End = 190f;
        float col2End = 405f;
        drawDashedLine(canvas, col1End, 6f, STUB_HEIGHT - 6f, accent);
        drawDashedLine(canvas, col2End, 6f, STUB_HEIGHT - 6f, accent);

        String typeLabel = (ticketTypeName != null && !ticketTypeName.isBlank())
                ? ticketTypeName.toUpperCase() : "STANDARD";
        Integer price    = resolveTicketPrice(event, typeLabel);
        float   centerY  = STUB_HEIGHT / 2f;

        // ── Colonne 1 : TICKET / type ─────────────────────────────────────────
        float c1CX = (STUB_BAR_W + col1End) / 2f;

        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.60f));
        canvas.setFillColor(WHITE);
        drawCenteredText(canvas, regular, "TICKET", c1CX, centerY + 16f, 7f);
        canvas.restoreState();

        float typeSz = fitFontSize(typeLabel, bold, col1End - STUB_BAR_W - 16f, 14f, 9f);
        canvas.saveState();
        canvas.setFillColor(accent);
        drawCenteredText(canvas, bold, typeLabel, c1CX, centerY - 4f, typeSz);
        canvas.restoreState();

        // ── Colonne 2 : Prix centré ───────────────────────────────────────────
        float c2CX = (col1End + col2End) / 2f;

        if (price != null) {
            canvas.saveState();
            canvas.setFillColor(WHITE);
            drawCenteredText(canvas, bold, formatPrice(price), c2CX, centerY + 6f, 18f);
            canvas.restoreState();

            canvas.saveState();
            canvas.setExtGState(new PdfExtGState().setFillOpacity(0.65f));
            canvas.setFillColor(LAVENDER);
            drawCenteredText(canvas, regular, "F C F A", c2CX, centerY - 11f, 8f);
            canvas.restoreState();
        } else {
            canvas.saveState();
            canvas.setFillColor(WHITE);
            drawCenteredText(canvas, bold, "INVITATION", c2CX, centerY + 2f, 11f);
            canvas.restoreState();
        }

        // ── Colonne 3 : Titre + date + prénom ────────────────────────────────
        float c3CX = (col2End + PAGE_W) / 2f;
        float c3W  = PAGE_W - col2End - 10f;

        String titleShort = truncate(event.getTitle() != null ? event.getTitle() : "ÉVÉNEMENT", 22);
        float  titleSz3   = fitFontSize(titleShort, bold, c3W, 9f, 7f);

        canvas.saveState();
        canvas.setFillColor(WHITE);
        drawCenteredText(canvas, bold, titleShort, c3CX, centerY + 14f, titleSz3);
        canvas.restoreState();

        if (event.getStartDate() != null) {
            String dateShort = event.getStartDate()
                    .format(DateTimeFormatter.ofPattern("dd / MM / yyyy"));
            canvas.saveState();
            canvas.setExtGState(new PdfExtGState().setFillOpacity(0.65f));
            canvas.setFillColor(LAVENDER);
            drawCenteredText(canvas, regular, dateShort, c3CX, centerY - 2f, 8f);
            canvas.restoreState();
        }

        if (participantName != null && !participantName.isBlank()) {
            canvas.saveState();
            canvas.setExtGState(new PdfExtGState().setFillOpacity(0.50f));
            canvas.setFillColor(WHITE);
            drawCenteredText(canvas, regular, truncate(participantName, 16), c3CX, centerY - 15f, 7.5f);
            canvas.restoreState();
        }
    }

    // =========================================================================
    // MÉTHODES DE DESSIN RÉUTILISABLES
    // =========================================================================

    /** Ligne décorative : deux traits + losange central. */
    private void drawDecorativeRule(PdfCanvas canvas, DeviceRgb accent, float y) {
        float cx  = PAGE_W / 2f;
        float gap = 14f;
        float len = 80f;
        float d   = 4f;

        canvas.saveState();
        canvas.setStrokeColor(accent).setLineWidth(0.6f);
        canvas.moveTo(cx - gap - len, y).lineTo(cx - gap, y).stroke();
        canvas.moveTo(cx + gap,       y).lineTo(cx + gap + len, y).stroke();

        canvas.setFillColor(accent);
        canvas.moveTo(cx, y + d).lineTo(cx + d, y)
              .lineTo(cx, y - d).lineTo(cx - d, y)
              .closePath().fill();
        canvas.restoreState();
    }

    /**
     * Pill date : fond blanc arrondi, texte BG_DARK à l'intérieur.
     * @return nouveau Y (bas de la pill)
     */
    private float drawDatePill(PdfCanvas canvas, PdfFont bold, String dateStr,
                                float x, float y) throws IOException {
        float pillH   = 22f;
        float pillPad = 10f;
        float textSz  = 8.5f;
        String upper  = dateStr.toUpperCase();
        float  pillW  = bold.getWidth(upper, textSz) + pillPad * 2f;
        float  pillY  = y - pillH;

        canvas.saveState();
        canvas.setFillColor(WHITE);
        drawRoundedRect(canvas, x, pillY, pillW, pillH, pillH / 2f);
        canvas.fill();
        canvas.restoreState();

        canvas.saveState();
        canvas.setFillColor(BG_DARK);
        canvas.beginText().setFontAndSize(bold, textSz)
              .moveText(x + pillPad, pillY + (pillH - textSz) / 2f + 1.5f)
              .showText(upper).endText();
        canvas.restoreState();

        return pillY;
    }

    /**
     * Cellule d'info glassmorphisme pleine largeur (label en accent + valeur en blanc).
     * @return nouveau Y (bas de la cellule)
     */
    private float drawInfoCell(PdfCanvas canvas, PdfFont bold, PdfFont regular,
                                String label, String value,
                                float x, float y, float w, DeviceRgb accent) throws IOException {
        float cellH   = 38f;
        float cellPad = 8f;
        float cellY   = y - cellH;

        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.16f));
        canvas.setFillColor(WHITE);
        drawRoundedRect(canvas, x, cellY, w, cellH, 6f);
        canvas.fill();
        canvas.restoreState();

        canvas.saveState();
        canvas.setFillColor(accent);
        canvas.beginText().setFontAndSize(bold, 7f)
              .moveText(x + cellPad, cellY + cellH - 12f).showText(label).endText();
        canvas.restoreState();

        canvas.saveState();
        canvas.setFillColor(WHITE);
        float valSz = fitFontSize(truncate(value, 55), regular, w - cellPad * 2f, 9f, 7f);
        canvas.beginText().setFontAndSize(regular, valSz)
              .moveText(x + cellPad, cellY + cellH - 24f).showText(truncate(value, 55)).endText();
        canvas.restoreState();

        return cellY;
    }

    /** Ligne verticale en pointillés. */
    private void drawDashedLine(PdfCanvas canvas, float x, float yStart, float yEnd,
                                DeviceRgb color) {
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setStrokeOpacity(0.25f));
        canvas.setStrokeColor(color);
        canvas.setLineWidth(0.5f);
        float dashLen = 3f;
        float gapLen  = 3f;
        float cy = yStart;
        while (cy < yEnd) {
            canvas.moveTo(x, cy).lineTo(x, Math.min(cy + dashLen, yEnd));
            cy += dashLen + gapLen;
        }
        canvas.stroke();
        canvas.restoreState();
    }

    // =========================================================================
    // TRAITEMENT IMAGE
    // =========================================================================

    /** Applique 3 passes de flou gaussien 3×3 (ConvolveOp). */
    private byte[] applyGaussianBlur(byte[] imageBytes) throws IOException {
        if (imageBytes == null || imageBytes.length == 0) return imageBytes;

        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            BufferedImage src = ImageIO.read(bais);
            if (src == null) return imageBytes;

            // Conversion TYPE_INT_RGB pour stabilité ConvolveOp
            BufferedImage rgb = new BufferedImage(src.getWidth(), src.getHeight(),
                    BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g2 = rgb.createGraphics();
            g2.drawImage(src, 0, 0, null);
            g2.dispose();

            float[]    kd  = {1/16f, 2/16f, 1/16f, 2/16f, 4/16f, 2/16f, 1/16f, 2/16f, 1/16f};
            ConvolveOp op  = new ConvolveOp(new Kernel(3, 3, kd), ConvolveOp.EDGE_NO_OP, null);
            BufferedImage out = rgb;
            for (int p = 0; p < 3; p++) out = op.filter(out, null);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(out, "JPEG", baos);
            return baos.toByteArray();
        }
    }

    /** Supprime le fond blanc du logo (pixels R,G,B > 228 → transparent). */
    private byte[] removeLogoWhiteBg(byte[] imageBytes) throws IOException {
        if (imageBytes == null || imageBytes.length == 0) return imageBytes;

        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            BufferedImage src = ImageIO.read(bais);
            if (src == null) return imageBytes;

            int           w   = src.getWidth();
            int           h   = src.getHeight();
            BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);

            for (int px = 0; px < w; px++) {
                for (int py = 0; py < h; py++) {
                    int argb = src.getRGB(px, py);
                    int r    = (argb >> 16) & 0xFF;
                    int g    = (argb >>  8) & 0xFF;
                    int b    =  argb        & 0xFF;
                    out.setRGB(px, py, (r > 228 && g > 228 && b > 228)
                            ? 0x00000000 : (argb | 0xFF000000));
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(out, "PNG", baos);
            return baos.toByteArray();
        }
    }

    // =========================================================================
    // RÉSOLUTION COULEUR ACCENT ET PRIX
    // =========================================================================

    private DeviceRgb resolveAccentColor(EventResponse event, String ticketTypeName) {
        List<EventTicketTypeDTO> types = event.getTicketTypes();
        if (types == null || ticketTypeName == null) return GOLD;
        return types.stream()
                .filter(t -> ticketTypeName.equalsIgnoreCase(t.getName()))
                .map(EventTicketTypeDTO::getAccentColor)
                .filter(hex -> hex != null && hex.startsWith("#") && hex.length() >= 7)
                .map(hex -> rgb(
                        Integer.parseInt(hex.substring(1, 3), 16),
                        Integer.parseInt(hex.substring(3, 5), 16),
                        Integer.parseInt(hex.substring(5, 7), 16)))
                .findFirst().orElse(GOLD);
    }

    private Integer resolveTicketPrice(EventResponse event, String ticketTypeName) {
        List<EventTicketTypeDTO> types = event.getTicketTypes();
        if (types != null) {
            String key = normalizeKey(ticketTypeName);
            return types.stream()
                    .filter(t -> normalizeKey(t.getName()).equals(key))
                    .map(EventTicketTypeDTO::getPrice)
                    .filter(p -> p != null)
                    .findFirst()
                    .orElse(defaultPriceFor(ticketTypeName));
        }
        return defaultPriceFor(ticketTypeName);
    }

    private Integer defaultPriceFor(String ticketTypeName) {
        String key = normalizeKey(ticketTypeName);
        if ("VVIP".equals(key))                          return 100000;
        if ("VIP".equals(key))                           return 50000;
        if ("STANDARD".equals(key) || key.isBlank())     return 25000;
        return null;
    }

    // =========================================================================
    // UTILITAIRES GRAPHIQUES
    // =========================================================================

    private static DeviceRgb rgb(int r, int g, int b) {
        return new DeviceRgb(r / 255f, g / 255f, b / 255f);
    }

    private static DeviceRgb blend(DeviceRgb a, DeviceRgb b, float t) {
        float[] ca = a.getColorValue();
        float[] cb = b.getColorValue();
        return new DeviceRgb(
                ca[0] + (cb[0] - ca[0]) * t,
                ca[1] + (cb[1] - ca[1]) * t,
                ca[2] + (cb[2] - ca[2]) * t);
    }

    private float fitFontSize(String text, PdfFont font, float maxWidth,
                              float maxSize, float minSize) throws IOException {
        for (float s = maxSize; s >= minSize; s -= 0.5f) {
            if (font.getWidth(text, s) <= maxWidth) return s;
        }
        return minSize;
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() <= maxLen ? text : text.substring(0, maxLen - 1) + "\u2026";
    }

    private String normalizeKey(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
    }

    private String formatPrice(int price) {
        String raw = String.valueOf(price);
        return raw.length() > 3
                ? raw.substring(0, raw.length() - 3) + " " + raw.substring(raw.length() - 3)
                : raw;
    }

    private void drawCenteredText(PdfCanvas canvas, PdfFont font, String text,
                                   float centerX, float y, float fontSize) {
        float w = font.getWidth(text, fontSize);
        canvas.beginText().setFontAndSize(font, fontSize)
              .moveText(centerX - w / 2f, y).showText(text).endText();
    }

    private float drawWrappedText(PdfCanvas canvas, PdfFont font, String text,
                                   float x, float y, float maxWidth,
                                   float fontSize, float lineHeight) {
        if (text == null || text.isBlank()) return y;
        String[]      words     = text.trim().split("\\s+");
        StringBuilder line      = new StringBuilder();
        float         currentY  = y;

        for (String word : words) {
            String candidate = line.length() == 0 ? word : line + " " + word;
            if (font.getWidth(candidate, fontSize) <= maxWidth) {
                line.setLength(0);
                line.append(candidate);
            } else {
                if (line.length() > 0) {
                    canvas.beginText().setFontAndSize(font, fontSize)
                          .moveText(x, currentY).showText(line.toString()).endText();
                    currentY -= lineHeight;
                }
                line.setLength(0);
                line.append(word);
            }
        }
        if (line.length() > 0) {
            canvas.beginText().setFontAndSize(font, fontSize)
                  .moveText(x, currentY).showText(line.toString()).endText();
        }
        return currentY;
    }

    private void drawRoundedRect(PdfCanvas canvas, float x, float y, float w, float h, float r) {
        float x1 = x + w;
        float y1 = y + h;
        float c  = r * 0.55228475f;
        canvas.moveTo(x + r, y)
              .lineTo(x1 - r, y)
              .curveTo(x1 - r + c, y,  x1, y + r - c,  x1, y + r)
              .lineTo(x1, y1 - r)
              .curveTo(x1, y1 - r + c, x1 - r + c, y1, x1 - r, y1)
              .lineTo(x + r, y1)
              .curveTo(x + r - c, y1, x,  y1 - r + c,  x,  y1 - r)
              .lineTo(x, y + r)
              .curveTo(x, y + r - c,  x + r - c, y,  x + r, y)
              .closePath();
    }

    // =========================================================================
    // CHARGEMENT POLICES (double-checked locking)
    // =========================================================================

    private PdfFont getFontRegular() throws IOException {
        PdfFont f = fontRegular;
        if (f != null) return f;
        synchronized (this) {
            if (fontRegular == null)
                fontRegular = loadFont(FONT_REGULAR_PATH, StandardFonts.HELVETICA);
            return fontRegular;
        }
    }

    private PdfFont getFontBold() throws IOException {
        PdfFont f = fontBold;
        if (f != null) return f;
        synchronized (this) {
            if (fontBold == null)
                fontBold = loadFont(FONT_BOLD_PATH, StandardFonts.HELVETICA_BOLD);
            return fontBold;
        }
    }

    private PdfFont getFontItalic() throws IOException {
        PdfFont f = fontItalic;
        if (f != null) return f;
        synchronized (this) {
            if (fontItalic == null)
                fontItalic = loadFont(FONT_ITALIC_PATH, StandardFonts.HELVETICA_OBLIQUE);
            return fontItalic;
        }
    }

    private PdfFont loadFont(String classpathPath, String fallback) throws IOException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(classpathPath)) {
            if (is == null) return PdfFontFactory.createFont(fallback);
            byte[] bytes = is.readAllBytes();
            return PdfFontFactory.createFont(bytes, PdfEncodings.IDENTITY_H,
                    PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
        }
    }
}
