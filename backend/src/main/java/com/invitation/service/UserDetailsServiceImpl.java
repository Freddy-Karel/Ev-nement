package com.invitation.service;

import com.invitation.model.User;
import com.invitation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implémentation de {@link UserDetailsService} pour Spring Security.
 *
 * <p>Charge un utilisateur depuis la base de données à partir de son email.
 * Retourne un objet {@link UserDetails} que Spring Security utilise
 * pour vérifier le mot de passe lors du login et peupler le SecurityContext.</p>
 *
 * <p>Tous les admins reçoivent le rôle {@code ROLE_ADMIN}.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Charge l'utilisateur par son email (utilisé comme username).
     *
     * @param email l'email de l'utilisateur
     * @return {@link UserDetails} prêt à être utilisé par Spring Security
     * @throws UsernameNotFoundException si aucun utilisateur ne correspond à cet email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Chargement de l'utilisateur par email : {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Utilisateur introuvable pour l'email : {}", email);
                    return new UsernameNotFoundException(
                            "Utilisateur introuvable : " + email
                    );
                });

        // Construit le UserDetails Spring Security avec le rôle ADMIN
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
