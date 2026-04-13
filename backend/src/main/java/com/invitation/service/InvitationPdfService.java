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
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Service de génération PDF bas niveau via iText7 {@link PdfCanvas}.
 *
 * <p>Génère un document A4 complet en dessinant calque par calque :</p>
 * <ol>
 *   <li>Fond dégradé violet sombre</li>
 *   <li>Bannière + fondu bas 25 bandes</li>
 *   <li>Logo dans anneau couleur accent</li>
 *   <li>Textes (organisateur, titre, invité, dates)</li>
 *   <li>Encadré LIEU | CONTACT</li>
 *   <li>Code vestimentaire</li>
 *   <li>QR code (pixels blancs sur fond transparent)</li>
 *   <li>Talon détachable (stub)</li>
 * </ol>
 *
 * <p>Coordonnées iText7 : origine (0,0) en BAS-GAUCHE, Y croissant vers le haut.</p>
 */
@Service
public class InvitationPdfService {

    private static final String FONT_REGULAR_PATH = "fonts/PlayfairDisplay-Regular.ttf";
    private static final String FONT_BOLD_PATH    = "fonts/PlayfairDisplay-Bold.ttf";
    private static final String FONT_ITALIC_PATH  = "fonts/PlayfairDisplay-Italic.ttf";

    private volatile PdfFont fontRegular;
    private volatile PdfFont fontBold;
    private volatile PdfFont fontItalic;

    // =========================================================================
    // CONSTANTES GÉOMÉTRIQUES (A4 en points)
    // =========================================================================
    private static final float PAGE_W            = PageSize.A4.getWidth();      // 595.27 pt
    private static final float PAGE_H            = PageSize.A4.getHeight();     // 841.89 pt
    private static final float BANNER_HEIGHT_MAX = PAGE_H * 0.75f;              // 75% pour l'affiche
    private static final float STUB_HEIGHT       = 95f;                         // Talon réduit
    private static final float QR_SIZE           = 80f;
    private static final float OVERLAY_OPACITY   = 0.55f;
    private static final float STUB_MARGIN       = 36f;
    private static final float INFO_ICON_SIZE    = 9f;

    // Icônes Textuelles
    private static final String ICON_CALENDAR = "DATE: ";
    private static final String ICON_TIME     = "HEURE: ";
    private static final String ICON_LOCATION = "LIEU: ";
    private static final String ICON_DRESS    = "DRESS: ";
    private static final String ICON_GUEST    = "INVITÉ(E): ";

    // =========================================================================
    // PALETTE (DeviceRgb attend des valeurs 0–1 : utiliser rgb() ci-dessous)
    // =========================================================================
    private static final DeviceRgb BG_DARK      = rgb(43,  5,  69);   // #2B0545
    private static final DeviceRgb BG_MEDIUM    = rgb(71,  5, 102);   // #470566
    private static final DeviceRgb WHITE        = rgb(255, 255, 255);
    private static final DeviceRgb GOLD         = rgb(212, 175,  55); // accent fallback
    private static final DeviceRgb LAVENDER     = rgb(200, 180, 220);

    // =========================================================================
    // POINT D'ENTRÉE PRINCIPAL
    // =========================================================================

    /**
     * Génère un PDF d'invitation A4 complet.
     *
     * @param event           données de l'événement
     * @param logoBytes       logo en bytes (PNG/JPEG) — null autorisé
     * @param bannerBytes     bannière en bytes — null autorisé
     * @param ticketTypeName  nom du type de billet (ex : "VIP")
     * @param participantName prénom de l'invité
     * @param qrData          données QR code (URL de confirmation)
     * @return PDF sérialisé en bytes
     */
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
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
        pdfDoc.addNewPage(new PageSize(PAGE_W, PAGE_H));

        PdfPage page   = pdfDoc.getFirstPage();
        PdfCanvas canvas = new PdfCanvas(page);

        drawBackground(canvas);
        drawBanner(canvas, bannerBytes);
        drawInfoGrid(canvas, event, participantName, accent, qrData);
        drawStub(canvas, event, participantName, ticketTypeName, accent, logoBytes);

        canvas.release();
        pdfDoc.close();
        return baos.toByteArray();
    }

    // =========================================================================
    // 1. FOND — dégradé BG_DARK (bas) → BG_MEDIUM (haut) par 30 bandes
    // =========================================================================

    private void drawBackground(PdfCanvas canvas) {
        int   bands  = 30;
        float bandH  = PAGE_H / bands;

        canvas.saveState();
        for (int i = 0; i < bands; i++) {
            float t = (float) i / (bands - 1);   // 0 = bas, 1 = haut
            canvas.setFillColor(blend(BG_DARK, BG_MEDIUM, t));
            canvas.rectangle(0, i * bandH, PAGE_W, bandH + 1f); // +1 évite les gaps sub-pixel
            canvas.fill();
        }
        canvas.restoreState();
    }

    // =========================================================================
    // 2. BANNIÈRE — image + fondu bas 25 bandes semi-transparentes
    // =========================================================================

    private void drawBanner(PdfCanvas canvas, byte[] bannerBytes) throws IOException {
        float bannerY = PAGE_H - BANNER_HEIGHT_MAX;

        // Image
        if (bannerBytes != null && bannerBytes.length > 0) {
            PdfImageXObject xObj = new PdfImageXObject(ImageDataFactory.create(bannerBytes));
            canvas.saveState();
            canvas.addXObjectFittedIntoRectangle(xObj,
                    new Rectangle(0, bannerY, PAGE_W, BANNER_HEIGHT_MAX));
            canvas.restoreState();
        }

        // Overlay semi-transparent pour lisibilité parfaite
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(OVERLAY_OPACITY));
        canvas.setFillColor(BG_DARK);
        canvas.rectangle(0, bannerY, PAGE_W, BANNER_HEIGHT_MAX);
        canvas.fill();
        canvas.restoreState();
    }

    // =========================================================================
    // 4. ZONE INFO GRILLE (2 colonnes) + TEXTES + QR
    // =========================================================================

    private void drawInfoGrid(PdfCanvas canvas, EventResponse event, String participantName,
                              DeviceRgb accent, String qrData) throws IOException, WriterException {
        PdfFont bold    = getFontBold();
        PdfFont regular = getFontRegular();
        PdfFont italic  = getFontItalic();

        float infoTop = PAGE_H - BANNER_HEIGHT_MAX;
        float leftX = 40f;

        float qrReservedW = (qrData != null && !qrData.isBlank()) ? (QR_SIZE + 60f) : 0f;
        float maxTextW = PAGE_W - leftX - 40f - qrReservedW;
        float infoBottom = STUB_HEIGHT + 14f;

        canvas.saveState();

        float blockGap = 14f;
        float currentY = infoTop - 18f;
        String title = event.getTitle() != null ? event.getTitle().toUpperCase() : "ÉVÉNEMENT";
        float titleSize = fitFontSize(title, bold, maxTextW, 18f, 11f);
        canvas.setFillColor(accent);
        canvas.beginText().setFontAndSize(bold, titleSize)
              .moveText(leftX, currentY).showText(title).endText();

        // 2. Ligne décorative ◆
        currentY -= blockGap;
        canvas.setFillColor(accent);
        canvas.beginText().setFontAndSize(regular, 10f)
              .moveText(leftX, currentY).showText("◆").endText();
        canvas.setStrokeColor(accent).setLineWidth(0.5f);
        canvas.moveTo(leftX + 15f, currentY + 3f).lineTo(leftX + 200f, currentY + 3f).stroke();

        // 3. Date et Horaire avec Icônes textuelles
        currentY -= blockGap;
        if (event.getStartDate() != null) {
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy", Locale.FRENCH);
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH'h'mm");
            String dateStr = event.getStartDate().format(dateFmt).toUpperCase();
            String timeStr = event.getStartDate().format(timeFmt);
            if (event.getEndDate() != null) timeStr += " - " + event.getEndDate().format(timeFmt);

            drawIconCalendar(canvas, leftX - 18f, currentY - 1f, INFO_ICON_SIZE, LAVENDER);
            String dateLine = ICON_CALENDAR + dateStr + "   " + ICON_TIME + timeStr;
            canvas.setFillColor(WHITE);
            currentY = drawWrappedText(canvas, bold, dateLine, leftX, currentY, maxTextW, 9.5f, 13f);
        }

        // 4. Lieu / Contact / Dress Code
        currentY -= blockGap;
        if (currentY > infoBottom) {
            drawIconPin(canvas, leftX - 18f, currentY - 1f, INFO_ICON_SIZE, LAVENDER);
            String locLine = ICON_LOCATION + (event.getLocation() != null ? event.getLocation() : "Lieu à définir");
            canvas.setFillColor(WHITE);
            currentY = drawWrappedText(canvas, regular, locLine, leftX, currentY, maxTextW, 9f, 12.5f);
        }

        currentY -= 10f;
        if (event.getDressCode() != null && !event.getDressCode().isBlank() && currentY > infoBottom) {
            drawIconDress(canvas, leftX - 18f, currentY - 1f, INFO_ICON_SIZE, GOLD);
            currentY = drawWrappedText(canvas, italic, ICON_DRESS + event.getDressCode(), leftX, currentY, maxTextW, 8.8f, 12.2f);
        }

        // 5. Prénom Invité (Mise en évidence + gras)
        currentY -= blockGap;
        if (participantName != null && !participantName.isBlank() && currentY > infoBottom) {
            drawIconUser(canvas, leftX - 18f, currentY - 1f, INFO_ICON_SIZE, LAVENDER);
            canvas.setFillColor(LAVENDER);
            canvas.beginText().setFontAndSize(regular, 9.5f).moveText(leftX, currentY).showText(ICON_GUEST).endText();
            canvas.setFillColor(accent);
            String guest = truncate(participantName, 28);
            canvas.beginText().setFontAndSize(bold, 12f).moveText(leftX + 55f, currentY - 1f).showText(guest).endText();
        }

        canvas.restoreState();

        // Colonne de droite : QR Code
        if (qrData != null && !qrData.isBlank()) {
            float qrX = PAGE_W - QR_SIZE - 40f;
            float qrY = infoTop - QR_SIZE - 20f;
            drawQRCode(canvas, qrData, qrX, qrY);
        }
    }

    // =========================================================================
    // 7. QR CODE — pixels BLANCS sur fond transparent, centré, Y=QR_Y depuis le bas
    // =========================================================================

    private void drawQRCode(PdfCanvas canvas, String qrData, float qrX, float qrY) throws WriterException, IOException {
        if (qrData == null || qrData.isBlank()) return;

        // Génération ZXing en 300×300 px
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);

        BitMatrix matrix = new QRCodeWriter()
                .encode(qrData, BarcodeFormat.QR_CODE, 300, 300, hints);

        // Pixels BLANCS (0xFFFFFFFF) sur fond TRANSPARENT (0x00000000)
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
        canvas.addXObjectFittedIntoRectangle(qrXObj, new Rectangle(qrX, qrY, QR_SIZE, QR_SIZE));
        canvas.restoreState();
    }

    // =========================================================================
    // 8. STUB — fond accent + bande gauche + pointillé + trous + textes
    // =========================================================================

    private void drawStub(PdfCanvas canvas, EventResponse event, String participantName,
                          String ticketTypeName, DeviceRgb accent, byte[] logoBytes) throws IOException {
        PdfFont bold    = getFontBold();
        PdfFont regular = getFontRegular();

        // Fond semi-transparent couleur accent
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.20f));
        canvas.setFillColor(accent);
        canvas.rectangle(0, 0, PAGE_W, STUB_HEIGHT);
        canvas.fill();
        canvas.restoreState();

        // Bande gauche opaque (couleur accent plein)
        canvas.saveState();
        canvas.setFillColor(accent);
        canvas.rectangle(0, 0, STUB_MARGIN, STUB_HEIGHT);
        canvas.fill();
        canvas.restoreState();

        // Panneau interne arrondi (plus raffiné)
        float panelX = STUB_MARGIN + 10f;
        float panelY = 10f;
        float panelW = PAGE_W - panelX - 10f;
        float panelH = STUB_HEIGHT - 20f;
        canvas.saveState();
        canvas.setExtGState(new PdfExtGState().setFillOpacity(0.22f));
        canvas.setFillColor(WHITE);
        drawRoundedRect(canvas, panelX, panelY, panelW, panelH, 12f);
        canvas.fill();
        canvas.restoreState();

        // Ligne solide élégante de séparation stub / corps au lieu de pointillés
        canvas.saveState();
        canvas.setStrokeColor(accent);
        canvas.setLineWidth(1.5f);
        canvas.moveTo(0, STUB_HEIGHT).lineTo(PAGE_W, STUB_HEIGHT).stroke();
        canvas.restoreState();

        // Trous de perforation (3 disques BG_DARK sur la ligne de découpe)
        canvas.saveState();
        canvas.setFillColor(BG_DARK);
        for (float hx : new float[]{22f, PAGE_W / 2f, PAGE_W - 22f}) {
            canvas.circle(hx, STUB_HEIGHT, 4.5f);
            canvas.fill();
        }
        canvas.restoreState();

        // Textes du stub
        float textY  = STUB_HEIGHT - 22f;
        float leftX  = STUB_MARGIN + 12f;
        float rightX = PAGE_W - STUB_MARGIN - 12f;
        float rightColumnW = 120f;

        canvas.saveState();

        // Titre abrégé (gauche)
        String titleShort = truncate(event.getTitle() != null ? event.getTitle() : "ÉVÉNEMENT", 28);
        canvas.setFillColor(WHITE);
        canvas.beginText().setFontAndSize(bold, 10f)
              .moveText(leftX, textY).showText(titleShort).endText();

        // Type de billet (droite, couleur accent)
        String typeLabel = (ticketTypeName != null && !ticketTypeName.isBlank()) ? ticketTypeName.toUpperCase() : "STANDARD";
        float  typeW     = bold.getWidth(typeLabel, 11f);
        canvas.setFillColor(accent);
        canvas.beginText().setFontAndSize(bold, 11f)
              .moveText(rightX - typeW, textY).showText(typeLabel).endText();

        Integer ticketPrice = resolveTicketPrice(event, typeLabel);
        if (ticketPrice != null) {
            float stubCenterX = (leftX + (rightX - rightColumnW)) / 2f;

            canvas.saveState();
            canvas.setExtGState(new PdfExtGState().setFillOpacity(0.18f));
            canvas.setFillColor(WHITE);
            drawCenteredText(canvas, bold, typeLabel, stubCenterX, 58f, 14f);
            drawCenteredText(canvas, bold, Integer.toString(ticketPrice), stubCenterX, 30f, 34f);
            drawCenteredText(canvas, regular, "F C F A", stubCenterX, 14f, 10f);
            canvas.restoreState();
        }

        // Prénom invité (gauche, ligne 2)
        if (participantName != null && !participantName.isBlank()) {
            canvas.setFillColor(LAVENDER);
            canvas.beginText().setFontAndSize(regular, 9f)
                  .moveText(leftX, textY - 16f).showText(participantName).endText();
        }

        // Date courte (droite, ligne 2)
        if (event.getStartDate() != null) {
            String dateShort = event.getStartDate()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            float dateW = regular.getWidth(dateShort, 9f);
            canvas.setFillColor(WHITE);
            canvas.beginText().setFontAndSize(regular, 9f)
                  .moveText(rightX - dateW, textY - 16f).showText(dateShort).endText();

            if (logoBytes != null && logoBytes.length > 0) {
                float logoSize = 28f;
                float logoX = rightX - logoSize;
                float logoY = (textY - 16f) - 34f;
                drawStubLogo(canvas, logoBytes, logoX, Math.max(6f, logoY), logoSize, accent);
            }
        }

        // Lieu (gauche, ligne 3)
        if (event.getLocation() != null && !event.getLocation().isBlank()) {
            canvas.setFillColor(rgb(180, 160, 200));
            canvas.beginText().setFontAndSize(regular, 8f)
                  .moveText(leftX, textY - 32f)
                  .showText(truncate(event.getLocation(), 48)).endText();
        }

        canvas.restoreState();
    }

    // =========================================================================
    // UTILITAIRES
    // =========================================================================

    /** Crée un {@link DeviceRgb} depuis des composantes 0–255. */
    private static DeviceRgb rgb(int r, int g, int b) {
        return new DeviceRgb(r / 255f, g / 255f, b / 255f);
    }

    /**
     * Mélange linéaire entre deux couleurs.
     * t=0 → {@code a}, t=1 → {@code b}.
     */
    private static DeviceRgb blend(DeviceRgb a, DeviceRgb b, float t) {
        float[] ca = a.getColorValue();
        float[] cb = b.getColorValue();
        return new DeviceRgb(
                ca[0] + (cb[0] - ca[0]) * t,
                ca[1] + (cb[1] - ca[1]) * t,
                ca[2] + (cb[2] - ca[2]) * t
        );
    }

    /**
     * Résout la couleur d'accent depuis {@code event.ticketTypes}.
     * Retourne {@link #GOLD} si le type est introuvable ou si la config est absente.
     */
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
                .findFirst()
                .orElse(GOLD);
    }

    /**
     * Résout le ticket type DTO complet depuis {@code event.ticketTypes}.
     */
    private EventTicketTypeDTO resolveTicketType(EventResponse event, String ticketTypeName) {
        List<EventTicketTypeDTO> types = event.getTicketTypes();
        if (ticketTypeName == null) return null;
        if (types == null || types.isEmpty()) {
            return EventTicketTypeDTO.builder()
                    .name(ticketTypeName)
                    .price(defaultPriceFor(ticketTypeName))
                    .build();
        }
        String key = normalizeKey(ticketTypeName);
        EventTicketTypeDTO matched = types.stream()
                .filter(t -> normalizeKey(t.getName()).equals(key))
                .findFirst()
                .orElse(null);
        if (matched != null) return matched;
        return EventTicketTypeDTO.builder()
                .name(ticketTypeName)
                .price(defaultPriceFor(ticketTypeName))
                .build();
    }

    private Integer resolveTicketPrice(EventResponse event, String ticketTypeName) {
        EventTicketTypeDTO dto = resolveTicketType(event, ticketTypeName);
        if (dto != null && dto.getPrice() != null) return dto.getPrice();
        return defaultPriceFor(ticketTypeName);
    }

    private Integer defaultPriceFor(String ticketTypeName) {
        String key = normalizeKey(ticketTypeName);
        if ("VVIP".equals(key)) return 100000;
        if ("VIP".equals(key)) return 50000;
        if ("STANDARD".equals(key) || key.isBlank()) return 25000;
        return null;
    }

    /**
     * Réduit la taille de police de {@code maxSize} à {@code minSize} (pas 0.5)
     * jusqu'à ce que le texte tienne dans {@code maxWidth}.
     */
    private float fitFontSize(String text, PdfFont font, float maxWidth,
                              float maxSize, float minSize) throws IOException {
        for (float size = maxSize; size >= minSize; size -= 0.5f) {
            if (font.getWidth(text, size) <= maxWidth) return size;
        }
        return minSize;
    }

    /** Tronque avec U+2026 (…) si la chaîne dépasse {@code maxLen} caractères. */
    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() <= maxLen ? text : text.substring(0, maxLen - 1) + "\u2026";
    }

    private PdfFont getFontRegular() throws IOException {
        PdfFont f = fontRegular;
        if (f != null) return f;
        synchronized (this) {
            if (fontRegular == null) {
                fontRegular = loadFontOrFallback(FONT_REGULAR_PATH, StandardFonts.TIMES_ROMAN);
            }
            return fontRegular;
        }
    }

    private PdfFont getFontBold() throws IOException {
        PdfFont f = fontBold;
        if (f != null) return f;
        synchronized (this) {
            if (fontBold == null) {
                fontBold = loadFontOrFallback(FONT_BOLD_PATH, StandardFonts.TIMES_BOLD);
            }
            return fontBold;
        }
    }

    private PdfFont getFontItalic() throws IOException {
        PdfFont f = fontItalic;
        if (f != null) return f;
        synchronized (this) {
            if (fontItalic == null) {
                fontItalic = loadFontOrFallback(FONT_ITALIC_PATH, StandardFonts.TIMES_ITALIC);
            }
            return fontItalic;
        }
    }

    private PdfFont loadFontOrFallback(String classpathPath, String fallbackStdFont) throws IOException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(classpathPath)) {
            if (is == null) {
                return PdfFontFactory.createFont(fallbackStdFont);
            }
            byte[] bytes = is.readAllBytes();
            return PdfFontFactory.createFont(bytes, PdfEncodings.IDENTITY_H, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
        }
    }

    private float drawWrappedText(PdfCanvas canvas, PdfFont font, String text,
                                  float x, float y, float maxWidth,
                                  float fontSize, float lineHeight) {
        if (text == null || text.isBlank()) return y;
        String[] words = text.trim().split("\\s+");
        StringBuilder line = new StringBuilder();
        float currentY = y;

        for (String w : words) {
            String candidate = line.length() == 0 ? w : line + " " + w;
            if (font.getWidth(candidate, fontSize) <= maxWidth) {
                line.setLength(0);
                line.append(candidate);
            } else {
                canvas.beginText().setFontAndSize(font, fontSize)
                        .moveText(x, currentY).showText(line.toString()).endText();
                currentY -= lineHeight;
                line.setLength(0);
                line.append(w);
            }
        }

        if (line.length() > 0) {
            canvas.beginText().setFontAndSize(font, fontSize)
                    .moveText(x, currentY).showText(line.toString()).endText();
        }
        return currentY;
    }



    private String normalizeKey(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
    }

    private void drawCenteredText(PdfCanvas canvas, PdfFont font, String text,
                                  float centerX, float y, float fontSize) {
        float w = font.getWidth(text, fontSize);
        canvas.beginText().setFontAndSize(font, fontSize)
                .moveText(centerX - (w / 2f), y)
                .showText(text).endText();
    }

    private void drawRoundedRect(PdfCanvas canvas, float x, float y, float w, float h, float r) {
        float x0 = x;
        float y0 = y;
        float x1 = x + w;
        float y1 = y + h;
        float c = 0.55228475f;
        float rc = r * c;

        canvas.moveTo(x0 + r, y0);
        canvas.lineTo(x1 - r, y0);
        canvas.curveTo(x1 - r + rc, y0, x1, y0 + r - rc, x1, y0 + r);
        canvas.lineTo(x1, y1 - r);
        canvas.curveTo(x1, y1 - r + rc, x1 - r + rc, y1, x1 - r, y1);
        canvas.lineTo(x0 + r, y1);
        canvas.curveTo(x0 + r - rc, y1, x0, y1 - r + rc, x0, y1 - r);
        canvas.lineTo(x0, y0 + r);
        canvas.curveTo(x0, y0 + r - rc, x0 + r - rc, y0, x0 + r, y0);
        canvas.closePath();
    }

    private void drawStubLogo(PdfCanvas canvas, byte[] logoBytes, float x, float y, float size, DeviceRgb accent) throws IOException {
        PdfImageXObject logoXObj = new PdfImageXObject(ImageDataFactory.create(logoBytes));
        float cx = x + size / 2f;
        float cy = y + size / 2f;
        float rOuter = (size / 2f);
        float rRing = rOuter - 1.5f;
        float rInner = rOuter - 3.8f;

        canvas.saveState();
        canvas.setFillColor(accent);
        canvas.circle(cx, cy, rOuter);
        canvas.fill();

        canvas.setFillColor(WHITE);
        canvas.circle(cx, cy, rRing);
        canvas.fill();

        canvas.circle(cx, cy, rInner);
        canvas.clip();
        canvas.endPath();
        canvas.addXObjectFittedIntoRectangle(logoXObj, new Rectangle(x, y, size, size));
        canvas.restoreState();
    }

    private void drawIconCalendar(PdfCanvas canvas, float x, float y, float size, DeviceRgb color) {
        canvas.saveState();
        canvas.setStrokeColor(color).setLineWidth(1f);
        canvas.setFillColor(color);
        canvas.rectangle(x, y, size, size);
        canvas.stroke();
        canvas.rectangle(x, y + size * 0.72f, size, size * 0.28f);
        canvas.fill();
        canvas.rectangle(x + size * 0.18f, y + size * 0.82f, size * 0.14f, size * 0.18f);
        canvas.rectangle(x + size * 0.68f, y + size * 0.82f, size * 0.14f, size * 0.18f);
        canvas.fill();
        canvas.restoreState();
    }

    private void drawIconPin(PdfCanvas canvas, float x, float y, float size, DeviceRgb color) {
        canvas.saveState();
        canvas.setStrokeColor(color).setLineWidth(1f);
        float cx = x + size / 2f;
        float cy = y + size * 0.62f;
        canvas.circle(cx, cy, size * 0.28f);
        canvas.stroke();
        canvas.moveTo(cx, y);
        canvas.lineTo(cx - size * 0.22f, y + size * 0.45f);
        canvas.lineTo(cx + size * 0.22f, y + size * 0.45f);
        canvas.closePathStroke();
        canvas.restoreState();
    }

    private void drawIconDress(PdfCanvas canvas, float x, float y, float size, DeviceRgb color) {
        canvas.saveState();
        canvas.setStrokeColor(color).setLineWidth(1f);
        float cx = x + size / 2f;
        float topY = y + size;
        canvas.moveTo(cx - size * 0.20f, topY);
        canvas.lineTo(cx, topY - size * 0.18f);
        canvas.lineTo(cx + size * 0.20f, topY);
        canvas.stroke();
        canvas.rectangle(cx - size * 0.10f, topY - size * 0.18f, size * 0.20f, size * 0.18f);
        canvas.stroke();
        canvas.moveTo(cx - size * 0.32f, topY - size * 0.36f);
        canvas.lineTo(cx - size * 0.10f, topY - size * 0.18f);
        canvas.lineTo(cx + size * 0.10f, topY - size * 0.18f);
        canvas.lineTo(cx + size * 0.32f, topY - size * 0.36f);
        canvas.lineTo(cx + size * 0.16f, y);
        canvas.lineTo(cx - size * 0.16f, y);
        canvas.closePathStroke();
        canvas.restoreState();
    }

    private void drawIconUser(PdfCanvas canvas, float x, float y, float size, DeviceRgb color) {
        canvas.saveState();
        canvas.setStrokeColor(color).setLineWidth(1f);
        float cx = x + size / 2f;
        canvas.circle(cx, y + size * 0.70f, size * 0.22f);
        canvas.stroke();
        canvas.moveTo(cx - size * 0.38f, y + size * 0.18f);
        canvas.curveTo(cx - size * 0.22f, y + size * 0.40f, cx + size * 0.22f, y + size * 0.40f, cx + size * 0.38f, y + size * 0.18f);
        canvas.stroke();
        canvas.restoreState();
    }
}
