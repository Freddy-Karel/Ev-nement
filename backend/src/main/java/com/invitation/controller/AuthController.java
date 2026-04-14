package com.invitation.controller;

import com.invitation.config.JwtService;
import com.invitation.dto.request.ChangePasswordRequest;
import com.invitation.dto.request.LoginRequest;
import com.invitation.dto.request.RegisterRequest;
import com.invitation.dto.response.AuthResponse;
import com.invitation.model.User;
import com.invitation.model.enums.Role;
import com.invitation.repository.UserRepository;
import com.invitation.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur d'authentification.
 *
 * <p>Endpoints publics :</p>
 * <ul>
 *   <li>{@code POST /api/auth/login}             — connexion admin ou ambassadeur</li>
 *   <li>{@code POST /api/auth/register}           — inscription ambassadeur</li>
 *   <li>{@code POST /api/auth/forgot-password}    — envoi email de réinitialisation</li>
 *   <li>{@code POST /api/auth/reset-password}     — réinitialisation via token</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService            jwtService;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final EmailService          emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // =========================================================================
    // LOGIN
    // =========================================================================

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Tentative de connexion pour : {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable"));

            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("role", user.getRole().name());
            String token = jwtService.generateToken(extraClaims, userDetails.getUsername());

            log.info("Connexion réussie pour : {} ({})", request.getEmail(), user.getRole());
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(token)
                    .email(userDetails.getUsername())
                    .role(user.getRole().name())
                    .onboardingCompleted(user.isOnboardingCompleted())
                    .firstName(user.getFirstName())
                    .build());

        } catch (BadCredentialsException e) {
            log.warn("Échec d'authentification pour : {}", request.getEmail());
            throw e;
        }
    }

    // =========================================================================
    // REGISTER (Ambassadeur)
    // =========================================================================

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Inscription ambassadeur : {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(AuthResponse.builder()
                            .role("ERROR")
                            .email("Un compte existe déjà avec cet email.")
                            .build());
        }

        User referrer = null;
        if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
            referrer = userRepository.findByReferralCode(request.getReferralCode()).orElse(null);
            if (referrer == null) log.warn("Code de parrainage invalide : {}", request.getReferralCode());
        }

        String tempPassword = generateSecurePassword();

        User newUser = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.AMBASSADOR)
                .referrer(referrer)
                .build();

        userRepository.save(java.util.Objects.requireNonNull(newUser));

        if (referrer != null) {
            referrer.setInvitationCount(referrer.getInvitationCount() + 1);
            referrer.setPoints(referrer.getPoints() + 10);
            referrer.setRank(referrer.computeRank());
            userRepository.save(referrer);
            log.info("Parrainage crédité à : {} (+1 invitation, +10 pts)", referrer.getEmail());
        }

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", Role.AMBASSADOR.name());
        String token = jwtService.generateToken(extraClaims, newUser.getEmail());

        log.info("Ambassadeur créé : {} — Envoi de l'email de bienvenue.", newUser.getEmail());
        try {
            emailService.sendAmbassadorWelcome(newUser.getEmail(), newUser.getFirstName(), tempPassword);
        } catch (Exception ex) {
            log.error("Erreur email bienvenue à {} : {}", newUser.getEmail(), ex.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.builder()
                .token(token)
                .email(newUser.getEmail())
                .role(Role.AMBASSADOR.name())
                .onboardingCompleted(false)
                .firstName(newUser.getFirstName())
                .build());
    }

    // =========================================================================
    // MOT DE PASSE OUBLIÉ — envoi du lien de réinitialisation
    // =========================================================================

    /**
     * Génère un token sécurisé, le stocke sur l'entité User (1h d'expiration)
     * et envoie un email avec le lien de réinitialisation.
     *
     * <p>Répond toujours 200 OK, même si l'email est inconnu,
     * pour ne pas permettre l'énumération de comptes.</p>
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody Map<String, String> body) {

        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "L'email est obligatoire."));
        }

        userRepository.findByEmail(email.trim()).ifPresent(user -> {
            String resetToken = generateSecureToken();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            String resetUrl = frontendUrl + "/ambassador/reset-password?token=" + resetToken;
            try {
                emailService.sendPasswordReset(user.getEmail(), user.getFirstName(), resetUrl);
                log.info("Email de réinitialisation envoyé à {}", email);
            } catch (Exception ex) {
                log.error("Erreur email réinitialisation à {} : {}", email, ex.getMessage());
            }
        });

        return ResponseEntity.ok(Map.of("message",
                "Si un compte est associé à cet email, un lien de réinitialisation a été envoyé."));
    }

    // =========================================================================
    // RÉINITIALISATION DU MOT DE PASSE — via token reçu par email
    // =========================================================================

    /**
     * Vérifie le token, vérifie qu'il n'est pas expiré, met à jour le mot de passe
     * et invalide le token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody Map<String, String> body) {

        String token       = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token manquant."));
        }
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le mot de passe doit contenir au moins 8 caractères."));
        }

        User user = userRepository.findByPasswordResetToken(token)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Token invalide ou déjà utilisé."));
        }

        if (user.getPasswordResetTokenExpiry() == null
                || LocalDateTime.now().isAfter(user.getPasswordResetTokenExpiry())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Ce lien est expiré. Veuillez en demander un nouveau."));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);

        log.info("Mot de passe réinitialisé pour : {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès."));
    }

    // =========================================================================
    // MODIFICATION DE MOT DE PASSE (utilisateur connecté)
    // =========================================================================

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "L'ancien mot de passe est incorrect."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Mot de passe modifié pour : {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès."));
    }

    // =========================================================================
    // UTILITAIRES PRIVÉS
    // =========================================================================

    private String generateSecurePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) sb.append(chars.charAt(rng.nextInt(chars.length())));
        return sb.toString();
    }

    /** Génère un token URL-safe de 48 caractères hex. */
    private String generateSecureToken() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder(48);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
