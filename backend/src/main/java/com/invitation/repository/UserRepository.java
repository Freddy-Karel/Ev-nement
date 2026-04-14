package com.invitation.repository;

import com.invitation.model.User;
import com.invitation.model.enums.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository Spring Data JPA pour l'entité {@link User}.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByReferralCode(String referralCode);

    Optional<User> findByDisplayName(String displayName);

    boolean existsByDisplayName(String displayName);

    /** Top N ambassadeurs triés par invitations décroissantes. */
    @Query("SELECT u FROM User u WHERE u.role = 'AMBASSADOR' AND u.onboardingCompleted = true ORDER BY u.invitationCount DESC, u.points DESC")
    List<User> findTopAmbassadors(Pageable pageable);

    /** Compte total des ambassadeurs ayant terminé l'onboarding. */
    long countByRoleAndOnboardingCompleted(Role role, boolean onboardingCompleted);

    /** Compte total des utilisateurs parrainés (statut AMBASSADOR). */
    long countByRole(Role role);

    /** Recherche un utilisateur par son token de réinitialisation de mot de passe. */
    Optional<User> findByPasswordResetToken(String passwordResetToken);
}
