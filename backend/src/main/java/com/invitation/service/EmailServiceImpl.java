package com.invitation.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Implémentation RÉELLE du service d'envoi d'emails via Gmail SMTP.
 *
 * <p>Utilise {@link JavaMailSender} de Spring Boot Mail Starter.
 * Configuration SMTP dans {@code application.properties}.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private static final String APP_NAME = "FEMMES ROYALES";
    private static final String BRAND_COLOR = "#7B2D8B";

    // =========================================================================
    // INVITATION NOMINATIVE
    // =========================================================================

    @Override
    public void sendInvitation(String to, String firstName, String eventTitle, String confirmationUrl) {
        String subject = "🎟️ Vous êtes invité(e) à " + eventTitle;
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Bonjour %s, 👋</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Nous avons le plaisir de vous inviter à l'événement :
                    <strong style="color:%s;">%s</strong>
                  </p>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
                    Pour confirmer votre présence, veuillez cliquer sur le bouton ci-dessous.
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="%s" style="display:inline-block;background:%s;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                      ✅ Confirmer ma présence
                    </a>
                  </div>
                  <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
                    Ou copiez ce lien : <span style="word-break:break-all;">%s</span>
                  </p>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName), BRAND_COLOR, escape(eventTitle),
                confirmationUrl, BRAND_COLOR,
                confirmationUrl,
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Email d'invitation envoyé à {} pour '{}'", to, eventTitle);
    }

    // =========================================================================
    // INSCRIPTION PUBLIQUE — EN ATTENTE
    // =========================================================================

    @Override
    public void sendPendingConfirmation(String to, String firstName, String eventTitle) {
        String loginUrl = frontendUrl + "/login";
        String subject = "⏳ Votre inscription à " + eventTitle + " est en cours de traitement";
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Bonjour %s, 👋</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Nous avons bien reçu votre inscription pour l'événement :<br>
                    <strong style="color:%s;">%s</strong>
                  </p>
                  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
                    <p style="margin:0;color:#92400e;font-size:14px;">
                      ⏳ <strong>En attente de validation</strong><br>
                      Votre demande est en cours de traitement par l'équipe organisatrice.
                      Vous recevrez un email de confirmation dès qu'elle aura été traitée.
                    </p>
                  </div>
                  <p style="color:#4b5563;line-height:1.6;margin:20px 0;">
                    En attendant, vous pouvez déjà accéder à votre <strong>espace Ambassadeur</strong>
                    grâce aux identifiants reçus dans un email séparé.
                  </p>
                  <div style="text-align:center;margin:20px 0 16px;">
                    <a href="%s" style="display:inline-block;background:%s;color:#fff;padding:12px 30px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                      🚀 Accéder à mon espace Ambassadeur
                    </a>
                  </div>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName), BRAND_COLOR, escape(eventTitle),
                loginUrl, BRAND_COLOR,
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Email 'en attente' envoyé à {} pour '{}'", to, eventTitle);
    }

    // =========================================================================
    // VALIDATION ADMIN — INSCRIPTION CONFIRMÉE
    // =========================================================================

    @Override
    public void sendValidationConfirmation(String to, String firstName, String eventTitle) {
        String loginUrl = frontendUrl + "/login";
        String subject = "🎉 Votre inscription à " + eventTitle + " est confirmée !";
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Bonne nouvelle, %s ! 🎉</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Votre inscription à l'événement <strong style="color:%s;">%s</strong> a été <strong>validée</strong>.
                  </p>
                  <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0;">
                    <p style="margin:0;color:#065f46;font-size:14px;">
                      ✅ Vous êtes officiellement enregistré(e) comme participant(e).
                      Nous avons hâte de vous accueillir !
                    </p>
                  </div>
                  <p style="color:#4b5563;line-height:1.6;margin:20px 0;">
                    En tant qu'<strong>Ambassadeur ICC</strong>, vous pouvez partager votre lien de parrainage
                    et inviter vos proches à rejoindre l'événement !
                  </p>
                  <div style="text-align:center;margin:24px 0 16px;">
                    <a href="%s" style="display:inline-block;background:%s;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                      🚀 Accéder à mon Dashboard Ambassadeur
                    </a>
                  </div>
                  <p style="text-align:center;font-size:12px;color:#9ca3af;margin:0;">
                    Utilisez l'email et le mot de passe reçus dans votre email de bienvenue Ambassadeur.
                  </p>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName), BRAND_COLOR, escape(eventTitle),
                loginUrl, BRAND_COLOR,
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Email de validation envoyé à {} pour '{}'", to, eventTitle);
    }

    // =========================================================================
    // REFUS ADMIN — INSCRIPTION REJETÉE
    // =========================================================================

    @Override
    public void sendRejectionEmail(String to, String firstName, String eventTitle) {
        String subject = "Mise à jour concernant votre inscription à " + eventTitle;
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Bonjour %s,</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Nous vous remercions de l'intérêt que vous portez à notre événement :
                    <strong>%s</strong>.
                  </p>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Après examen de votre demande, nous ne sommes malheureusement pas en mesure
                    de confirmer votre inscription pour cette édition.
                  </p>
                  <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">
                    Nous espérons avoir l'occasion de vous accueillir lors d'un prochain événement.
                  </p>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName), escape(eventTitle),
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Email de refus envoyé à {} pour '{}'", to, eventTitle);
    }

    // =========================================================================
    // RENVOI D'INVITATION
    // =========================================================================

    @Override
    public void resendInvitationEmail(String to, String firstName, String eventTitle, String confirmationUrl) {
        String subject = "[Rappel] 🎟️ Votre invitation à " + eventTitle;
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Rappel — Bonjour %s, 👋</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Nous vous rappelons que vous êtes invité(e) à l'événement :
                    <strong style="color:%s;">%s</strong>
                  </p>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
                    Si vous n'avez pas encore confirmé votre présence, veuillez cliquer ci-dessous :
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="%s" style="display:inline-block;background:%s;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                      ✅ Confirmer ma présence
                    </a>
                  </div>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName), BRAND_COLOR, escape(eventTitle),
                confirmationUrl, BRAND_COLOR,
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Rappel d'invitation envoyé à {} pour '{}'", to, eventTitle);
    }

    // =========================================================================
    // BIENVENUE AMBASSADEUR (nouveaux identifiants)
    // =========================================================================

    @Override
    public void sendAmbassadorWelcome(String to, String firstName, String temporaryPassword) {
        String loginUrl = frontendUrl + "/login";
        String subject = "🌟 Bienvenue dans le programme Ambassadeur ICC !";
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Bienvenue, %s ! 🌟</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Votre inscription à un événement vous a automatiquement intégré(e) à notre
                    <strong style="color:%s;">programme Ambassadeur ICC</strong>.
                    Vous pouvez maintenant parrainer vos proches et gagner des points !
                  </p>
                  <div style="background:#f5f0ff;border-left:4px solid %s;padding:20px;border-radius:12px;margin:20px 0;">
                    <p style="margin:0 0 10px;font-weight:700;color:#4c1d95;">🔐 Vos identifiants de connexion</p>
                    <p style="margin:5px 0;color:#1f2937;">
                      <span style="color:#6b7280;">Email :</span>
                      <strong>%s</strong>
                    </p>
                    <p style="margin:5px 0;color:#1f2937;">
                      <span style="color:#6b7280;">Mot de passe temporaire :</span>
                      <strong style="background:#e5e7eb;padding:3px 8px;border-radius:6px;font-family:monospace;font-size:15px;">%s</strong>
                    </p>
                  </div>
                  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px;border-radius:8px;margin:0 0 24px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      ⚠️ <strong>Important :</strong> Ce mot de passe est temporaire.
                      Vous pourrez le modifier depuis votre profil après connexion.
                    </p>
                  </div>
                  <div style="text-align:center;margin:24px 0 16px;">
                    <a href="%s" style="display:inline-block;background:%s;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                      🚀 Accéder à mon Dashboard Ambassadeur
                    </a>
                  </div>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName),
                BRAND_COLOR, BRAND_COLOR,
                escape(to), escape(temporaryPassword),
                loginUrl, BRAND_COLOR,
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Email de bienvenue Ambassadeur envoyé à {}", to);
    }

    // =========================================================================
    // RÉINITIALISATION DE MOT DE PASSE
    // =========================================================================

    @Override
    public void sendPasswordReset(String to, String firstName, String resetUrl) {
        String subject = "🔑 Réinitialisation de votre mot de passe FEMMES ROYALES";
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:20px;">
                %s
                <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <h2 style="color:#1f2937;margin:0 0 12px;">Bonjour %s, 👋</h2>
                  <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
                    Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Ambassadeur.
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="%s" style="display:inline-block;background:%s;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
                      🔒 Réinitialiser mon mot de passe
                    </a>
                  </div>
                  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px;border-radius:8px;margin:0 0 20px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      ⏰ <strong>Ce lien expire dans 1 heure.</strong>
                      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
                  </div>
                  <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;word-break:break-all;">
                    Ou copiez ce lien : %s
                  </p>
                </div>
                %s
              </div>
            </body>
            </html>
            """.formatted(
                buildHeader(),
                escape(firstName),
                resetUrl, BRAND_COLOR,
                resetUrl,
                buildFooter()
        );
        sendHtmlEmail(to, subject, html);
        log.info("✉️  Email de réinitialisation de mot de passe envoyé à {}", to);
    }

    // =========================================================================
    // MÉTHODE CENTRALE D'ENVOI
    // =========================================================================

    @SuppressWarnings("null")
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, APP_NAME);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("❌ Erreur lors de l'envoi de l'email à {} — sujet '{}' : {}", to, subject, e.getMessage());
        }
    }

    // =========================================================================
    // CONSTRUCTEURS HTML COMMUNS
    // =========================================================================

    private String buildHeader() {
        return """
            <div style="text-align:center;padding:24px 0 16px;">
              <div style="display:inline-block;background:%s;width:52px;height:52px;border-radius:14px;
                          text-align:center;line-height:52px;font-size:18px;color:#fff;font-weight:700;">
                FR
              </div>
              <h1 style="color:#1f2937;margin:12px 0 4px;font-size:22px;">FEMMES ROYALES</h1>
              <p style="color:#6b7280;margin:0;font-size:13px;">Plateforme d&apos;invitations &amp; Ambassadrices</p>
            </div>
            """.formatted(BRAND_COLOR);
    }

    private String buildFooter() {
        return """
            <div style="text-align:center;padding:20px;font-size:11px;color:#9ca3af;">
              <p style="margin:0;">&copy; 2026 FEMMES ROYALES &mdash; Gabon</p>
              <p style="margin:4px 0 0;">Cet email a été généré automatiquement, merci de ne pas y répondre.</p>
            </div>
            """;
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }
}
