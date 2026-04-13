package com.invitation.service;

import com.invitation.exception.ResourceNotFoundException;
import com.invitation.model.User;
import com.invitation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service gérant les opérations liées aux utilisateurs administrateurs.
 *
 * <p>Principalement utilisé pour récupérer l'utilisateur courant
 * depuis le {@link SecurityContextHolder}, afin d'enrichir les logs
 * ou vérifier les permissions à grain fin si nécessaire.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Retourne l'entité {@link User} correspondant à l'admin actuellement authentifié.
     *
     * <p>Extrait l'email depuis le {@link SecurityContextHolder} (peuplé par
     * {@link com.invitation.config.JwtAuthenticationFilter})
     * et charge l'utilisateur depuis la base.</p>
     *
     * @return l'utilisateur admin courant
     * @throws ResourceNotFoundException si l'utilisateur n'existe plus en base
     * @throws IllegalStateException     si aucune authentification n'est présente dans le contexte
     */
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Aucun utilisateur authentifié dans le contexte de sécurité");
        }

        String email = authentication.getName();
        log.debug("Récupération de l'utilisateur courant : {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur courant introuvable : " + email
                ));
    }

    /**
     * Retourne un utilisateur par son email.
     *
     * @param email l'email de l'utilisateur
     * @return l'entité {@link User}
     * @throws ResourceNotFoundException si l'email n'existe pas
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur introuvable : " + email
                ));
    }
}
