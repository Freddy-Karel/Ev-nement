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
import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur d'authentification.
 *
 * <p>Endpoints publics :</p>
 * <ul>
 *   <li>{@code POST /api/auth/login}    — connexion admin ou ambassadeur</li>
 *   <li>{@code POST /api/auth/register} — inscription ambassadeur avec parrainage optionnel</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // =========================================================================
    // LOGIN
    // =========================================================================

    /**
     * Authentifie un utilisateur (admin ou ambassadeur) et retourne un JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Tentative de connexion pour : {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Récupérer l'utilisateur complet pour inclure le rôle dans la réponse
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable"));

            // Inclure le rôle dans le token JWT
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

    /**
     * Inscrit un nouvel ambassadeur.
     *
     * <p>Flux :</p>
     * <ol>
     *   <li>Vérifie que l'email n'existe pas déjà.</li>
     *   <li>Cherche le parrain via {@code referralCode} (optionnel).</li>
     *   <li>Génère un mot de passe temporaire et crée le compte.</li>
     *   <li>Incrémente les compteurs du parrain.</li>
     *   <li>Retourne un JWT immédiatement utilisable.</li>
     * </ol>
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        log.info("Inscription ambassadeur : {}", request.getEmail());

        // 1. Vérifier l'unicité de l'email
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(AuthResponse.builder()
                            .role("ERROR")
                            .email("Un compte existe déjà avec cet email.")
                            .build());
        }

        // 2. Trouver le parrain si un code est fourni
        User referrer = null;
        if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
            referrer = userRepository.findByReferralCode(request.getReferralCode()).orElse(null);
            if (referrer == null) {
                log.warn("Code de parrainage invalide : {}", request.getReferralCode());
                // On ne bloque pas l'inscription pour un code invalide
            }
        }

        // 3. Générer le mot de passe temporaire
        String tempPassword = generateSecurePassword();

        // 4. Créer le compte ambassadeur
        User newUser = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.AMBASSADOR)
                .referrer(referrer)
                .build();

        java.util.Objects.requireNonNull(newUser, "User ne peut pas être nul");
        userRepository.save(newUser);

        // 5. Mettre à jour les compteurs du parrain
        if (referrer != null) {
            referrer.setInvitationCount(referrer.getInvitationCount() + 1);
            referrer.setPoints(referrer.getPoints() + 10);
            referrer.setRank(referrer.computeRank());
            java.util.Objects.requireNonNull(referrer, "Referrer ne peut pas être nul");
            userRepository.save(referrer);
            log.info("Parrainage crédité à : {} (+1 invitation, +10 pts)", referrer.getEmail());
        }

        // 6. Générer le JWT
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", Role.AMBASSADOR.name());

        String token = jwtService.generateToken(extraClaims, newUser.getEmail());

        log.info("Ambassadeur créé : {} — Envoi de l'email de bienvenue.", newUser.getEmail());
        
        try {
            emailService.sendAmbassadorWelcome(newUser.getEmail(), newUser.getFirstName(), tempPassword);
        } catch (Exception ex) {
            log.error("Erreur lors de l'envoi de l'email de bienvenue à {} : {}", newUser.getEmail(), ex.getMessage());
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
    // MODIFICATION DE MOT DE PASSE
    // =========================================================================

    /**
     * Change le mot de passe de l'utilisateur connecté.
     * Nécessite un JWT valide.
     */
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

        log.info("Mot de passe modifié avec succès pour : {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès."));
    }

    // =========================================================================
    // UTILITAIRES PRIVÉS
    // =========================================================================

    private String generateSecurePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
