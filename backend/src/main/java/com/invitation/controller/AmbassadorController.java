package com.invitation.controller;

import com.invitation.dto.request.OnboardingRequest;
import com.invitation.dto.response.AmbassadorStatsResponse;
import com.invitation.dto.response.InvitationResponse;
import com.invitation.dto.response.LeaderboardEntry;
import com.invitation.model.User;
import com.invitation.repository.UserRepository;
import com.invitation.service.AmbassadorService;
import com.invitation.service.ParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour l'espace Ambassadeur.
 *
 * <p>Tous les endpoints requièrent un JWT valide avec rôle AMBASSADOR.</p>
 */
@RestController
@RequestMapping("/api/ambassador")
@RequiredArgsConstructor
@Slf4j
public class AmbassadorController {

    private final AmbassadorService ambassadorService;
    private final UserRepository userRepository;
    private final ParticipantService participantService;

    // =========================================================================
    // STATISTIQUES PERSONNELLES
    // =========================================================================

    /**
     * GET /api/ambassador/stats — Tableau de bord complet de l'ambassadeur connecté.
     */
    @GetMapping("/stats")
    public ResponseEntity<AmbassadorStatsResponse> getStats(
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = resolveUser(currentUser);
        log.debug("GET /api/ambassador/stats — {}", user.getEmail());
        return ResponseEntity.ok(ambassadorService.getStats(user.getId()));
    }

    // =========================================================================
    // ONBOARDING
    // =========================================================================

    /**
     * POST /api/ambassador/onboard — Enregistrer pseudo + avatar.
     */
    @PostMapping("/onboard")
    public ResponseEntity<Map<String, String>> onboard(
            @Valid @RequestBody OnboardingRequest request,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = resolveUser(currentUser);
        log.info("POST /api/ambassador/onboard — {} : {}", user.getEmail(), request.getDisplayName());
        ambassadorService.completeOnboarding(user.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Profil ambassadeur complété avec succès."));
    }

    /**
     * POST /api/ambassador/avatar — Mettre à jour uniquement l'avatar (Base64).
     */
    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> updateAvatar(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = resolveUser(currentUser);
        String base64 = body.get("avatarBase64");
        if (base64 == null || base64.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Avatar manquant."));
        }
        String url = ambassadorService.updateAvatar(user.getId(), base64);
        return ResponseEntity.ok(Map.of("avatarUrl", url));
    }

    // =========================================================================
    // CLASSEMENT
    // =========================================================================

    /**
     * GET /api/ambassador/leaderboard — Top 20 ambassadeurs (public pour les ambassadeurs).
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard() {
        log.debug("GET /api/ambassador/leaderboard");
        return ResponseEntity.ok(ambassadorService.getLeaderboard());
    }

    // =========================================================================
    // CARTE D'INVITATION / CONFIRMATION
    // =========================================================================

    /**
     * GET /api/ambassador/my-card/{participantId}
     * Retourne les données de carte pour UNE inscription de l'ambassadeur connecté.
     * Fonctionne pour les inscriptions nominatives (token) ET publiques (CONFIRMED).
     * Sécurité : vérifie que l'email de la participation correspond à l'utilisateur connecté.
     */
    @GetMapping("/my-card/{participantId}")
    public ResponseEntity<InvitationResponse> getMyCard(
            @PathVariable Long participantId,
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = resolveUser(currentUser);
        log.debug("GET /api/ambassador/my-card/{} — {}", participantId, user.getEmail());
        InvitationResponse card = participantService.getCardForAmbassador(participantId, user.getEmail());
        return ResponseEntity.ok(card);
    }

    // =========================================================================
    // PARRAINAGE
    // =========================================================================

    /**
     * POST /api/ambassador/generate-invite-link — Générer/récupérer le lien de parrainage.
     */
    @PostMapping("/generate-invite-link")
    public ResponseEntity<Map<String, String>> generateInviteLink(
            @AuthenticationPrincipal UserDetails currentUser
    ) {
        User user = resolveUser(currentUser);
        String link = ambassadorService.generateInviteLink(user.getId());
        return ResponseEntity.ok(Map.of("inviteLink", link));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + userDetails.getUsername()));
    }
}
