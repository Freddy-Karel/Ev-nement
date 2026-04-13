package com.invitation.service;

import com.invitation.dto.request.OnboardingRequest;
import com.invitation.dto.response.AmbassadorStatsResponse;
import com.invitation.dto.response.LeaderboardEntry;
import com.invitation.model.Participant;
import com.invitation.model.User;
import com.invitation.model.enums.Role;
import com.invitation.repository.ParticipantRepository;
import com.invitation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service métier pour l'espace Ambassadeur.
 *
 * <p>Gère :
 * <ul>
 *   <li>Statistiques personnelles (invitations, points, rang, progression)</li>
 *   <li>Onboarding (pseudo + avatar)</li>
 *   <li>Classement collectif (Top 20)</li>
 *   <li>Génération de lien de parrainage</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AmbassadorService {

    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;

    @Value("${app.base-url}")
    private String baseUrl;

    // ── Configuration des paliers de rang ──────────────────────────────────
    private static final Map<String, Integer> RANK_THRESHOLDS = Map.of(
            "RECRUE",  0,
            "ESTHER",  5,
            "DEBORAH", 15,
            "RUTH",    25,
            "ABIGAIL", 50,
            "KHAYIL",  75
    );

    private static final List<String> RANK_ORDER = List.of(
            "RECRUE", "ESTHER", "DEBORAH", "RUTH", "ABIGAIL", "KHAYIL"
    );

    // =========================================================================
    // STATISTIQUES
    // =========================================================================

    /**
     * Retourne les statistiques complètes d'un ambassadeur.
     */
    @Transactional(readOnly = true)
    public AmbassadorStatsResponse getStats(Long userId) {
        User user = getAmbassador(userId);

        int invitations  = user.getInvitationCount();
        String rank      = user.getRank();
        int currentThreshold = RANK_THRESHOLDS.getOrDefault(rank, 0);
        int nextThreshold    = getNextRankThreshold(invitations);
        int progress         = calculateProgress(currentThreshold, nextThreshold, invitations);
        String nextRankName  = getNextRankName(rank);

        // Mouvement collectif
        long totalAmbassadors  = userRepository.countByRoleAndOnboardingCompleted(Role.AMBASSADOR, true);
        long totalParticipants = userRepository.countByRole(Role.AMBASSADOR);

        // Downline (personnes parrainées)
        List<AmbassadorStatsResponse.DownlineUser> downline = user.getReferrals().stream()
                .map(referred -> AmbassadorStatsResponse.DownlineUser.builder()
                        .id(referred.getId())
                        .displayName(referred.getDisplayName() != null ? referred.getDisplayName() : referred.getFirstName())
                        .firstName(referred.getFirstName())
                        .avatarUrl(referred.getAvatarUrl())
                        .joinedAt(referred.getCreatedAt() != null
                                ? referred.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)
                                : "")
                        .build())
                .collect(Collectors.toList());

        // Événements de l'ambassadeur (via la table participants)
        List<Participant> registrations = participantRepository.findByEmail(user.getEmail());
        List<AmbassadorStatsResponse.EventRegistration> events = registrations.stream()
                .map(p -> AmbassadorStatsResponse.EventRegistration.builder()
                        .eventId(p.getEvent().getId())
                        .participantId(p.getId())
                        .eventTitle(p.getEvent().getTitle())
                        .eventDates(formatEventDates(p))
                        .status(p.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        return AmbassadorStatsResponse.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .rank(rank)
                .invitationCount(invitations)
                .points(user.getPoints())
                .currentRankThreshold(currentThreshold)
                .nextRankThreshold(nextThreshold)
                .progressToNextRank(progress)
                .nextRankName(nextRankName)
                .referralCode(user.getReferralCode())
                .onboardingCompleted(user.isOnboardingCompleted())
                .totalAmbassadors(totalAmbassadors)
                .totalParticipants(totalParticipants)
                .downline(downline)
                .events(events)
                .build();
    }

    // =========================================================================
    // ONBOARDING
    // =========================================================================

    /**
     * Complète l'étape d'onboarding : pseudo + avatar optionnel.
     */
    @Transactional
    public void completeOnboarding(Long userId, OnboardingRequest request) {
        User user = getAmbassador(userId);

        // Vérifier l'unicité du pseudo
        if (userRepository.existsByDisplayName(request.getDisplayName())) {
            // Accepter si c'est le même utilisateur (mise à jour)
            userRepository.findByDisplayName(request.getDisplayName())
                    .filter(u -> !u.getId().equals(userId))
                    .ifPresent(u -> { throw new IllegalArgumentException("Ce pseudo est déjà utilisé."); });
        }

        user.setDisplayName(request.getDisplayName());

        // Avatar : base64 fourni ou SVG par défaut
        if (request.getAvatarBase64() != null && !request.getAvatarBase64().isBlank()) {
            user.setAvatarUrl(request.getAvatarBase64());
        } else if (user.getAvatarUrl() == null) {
            user.setAvatarUrl(generateDefaultAvatar(user.getFirstName(), user.getLastName()));
        }

        user.setOnboardingCompleted(true);
        userRepository.save(user);
        log.info("Onboarding complété pour l'ambassadeur {} ({})", userId, request.getDisplayName());
    }

    /**
     * Met à jour uniquement l'avatar.
     */
    @Transactional
    public String updateAvatar(Long userId, String base64Image) {
        User user = getAmbassador(userId);
        user.setAvatarUrl(base64Image);
        userRepository.save(user);
        return base64Image;
    }

    // =========================================================================
    // CLASSEMENT
    // =========================================================================

    /**
     * Retourne le Top 20 des ambassadeurs pour le podium.
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getLeaderboard() {
        List<User> top = userRepository.findTopAmbassadors(PageRequest.of(0, 20));
        List<LeaderboardEntry> result = new ArrayList<>();
        int position = 1;
        for (User u : top) {
            result.add(LeaderboardEntry.builder()
                    .id(u.getId())
                    .displayName(u.getDisplayName())
                    .avatarUrl(u.getAvatarUrl())
                    .invitationCount(u.getInvitationCount())
                    .points(u.getPoints())
                    .rank(u.getRank())
                    .rankPosition(position++)
                    .build());
        }
        return result;
    }

    // =========================================================================
    // PARRAINAGE
    // =========================================================================

    /**
     * Génère et retourne le lien d'invitation unique de l'ambassadeur.
     */
    @Transactional
    public String generateInviteLink(Long userId) {
        User user = getAmbassador(userId);
        // Le referralCode est généré à la création (@PrePersist), mais on s'assure qu'il existe
        if (user.getReferralCode() == null) {
            user.setReferralCode(buildReferralCode(user));
            userRepository.save(user);
        }
        return baseUrl + "/register?ref=" + user.getReferralCode();
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    private User getAmbassador(Long userId) {
        return userRepository.findById(java.util.Objects.requireNonNull(userId, "L'ID de l'ambassadeur ne peut pas être nul"))
                .orElseThrow(() -> new RuntimeException("Ambassadeur introuvable : " + userId));
    }

    private int getNextRankThreshold(int currentInvitations) {
        for (String rank : RANK_ORDER) {
            int threshold = RANK_THRESHOLDS.get(rank);
            if (threshold > currentInvitations) return threshold;
        }
        return currentInvitations; // Rang maximum atteint
    }

    private int calculateProgress(int current, int next, int invitations) {
        if (next <= current) return 100;
        int span = next - current;
        int done = invitations - current;
        return Math.max(0, Math.min(100, (done * 100) / span));
    }

    private String getNextRankName(String currentRank) {
        int idx = RANK_ORDER.indexOf(currentRank);
        if (idx < 0 || idx >= RANK_ORDER.size() - 1) return "KHAYIL";
        return RANK_ORDER.get(idx + 1);
    }

    private String generateDefaultAvatar(String firstName, String lastName) {
        String f = (firstName != null && !firstName.isEmpty()) ? firstName.substring(0, 1).toUpperCase() : "?";
        String l = (lastName  != null && !lastName.isEmpty())  ? lastName.substring(0, 1).toUpperCase()  : "";
        String initials = f + l;
        String svg = "<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\">"
                + "<circle cx=\"50\" cy=\"50\" r=\"50\" fill=\"#7B2D8B\"/>"
                + "<text x=\"50\" y=\"67\" font-size=\"36\" text-anchor=\"middle\" fill=\"white\" font-family=\"Poppins,Arial\">"
                + initials + "</text></svg>";
        return "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svg.getBytes());
    }

    private String buildReferralCode(User user) {
        String base = user.getEmail().split("@")[0]
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "")
                .substring(0, Math.min(8, user.getEmail().split("@")[0].length()));
        return base + "_" + Long.toHexString(System.currentTimeMillis()).toUpperCase().substring(0, 6);
    }

    private String formatEventDates(Participant p) {
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String start = p.getEvent().getStartDate() != null ? p.getEvent().getStartDate().format(fmt) : "";
            String end   = p.getEvent().getEndDate()   != null ? p.getEvent().getEndDate().format(fmt)   : "";
            return start.equals(end) ? start : start + " – " + end;
        } catch (Exception e) {
            return "";
        }
    }
}
