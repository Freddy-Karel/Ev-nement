package com.invitation.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Entrée du classement pour GET /api/ambassador/leaderboard.
 */
@Data
@Builder
public class LeaderboardEntry {

    private Long id;
    private String displayName;
    private String avatarUrl;
    private int invitationCount;
    private int points;
    private String rank;

    /** Position dans le classement (1 = meilleur). */
    private int rankPosition;
}
