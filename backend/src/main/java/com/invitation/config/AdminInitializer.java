package com.invitation.config;

import com.invitation.model.User;
import com.invitation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Initialise l'administrateur par défaut au démarrage de l'application.
 *
 * <p>Vérifie si la table {@code users} est vide. Si oui, crée un compte admin
 * avec les identifiants définis dans {@code application.properties} :</p>
 * <ul>
 *   <li>{@code admin.default.email}</li>
 *   <li>{@code admin.default.password} (encodé en BCrypt)</li>
 * </ul>
 *
 * <p>Ce composant est idempotent : il ne crée rien si un admin existe déjà,
 * ce qui permet de redémarrer l'application sans risque de doublon.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.default.email}")
    private String adminEmail;

    @Value("${admin.default.password}")
    private String adminPassword;

    /**
     * Exécuté automatiquement après le démarrage du contexte Spring.
     *
     * @param args arguments de ligne de commande (non utilisés)
     */
    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = Objects.requireNonNull(User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .firstName("Admin")
                    .lastName("ICC")
                    .build(), "L'utilisateur admin par défaut ne peut pas être null");

            userRepository.save(Objects.requireNonNull(admin, "L'utilisateur admin doit être présent avant sauvegarde"));

            log.info("========================================================");
            log.info("  Admin par défaut créé avec succès");
            log.info("  Email    : {}", adminEmail);
            log.info("  Password : {} (stocké en BCrypt)", adminPassword);
            log.info("========================================================");
        } else {
            log.info("Admin déjà existant en base — aucun utilisateur créé.");
        }
    }
}
