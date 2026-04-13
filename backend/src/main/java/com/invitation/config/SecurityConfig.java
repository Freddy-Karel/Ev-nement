package com.invitation.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Configuration principale de Spring Security.
 *
 * <p>Politique appliquée :</p>
 * <ul>
 *   <li>CSRF désactivé (API REST stateless).</li>
 *   <li>Sessions désactivées (JWT = stateless).</li>
 *   <li>Endpoints publics : {@code /api/auth/**} et {@code /api/public/**}.</li>
 *   <li>Tous les autres endpoints requièrent un JWT valide.</li>
 *   <li>Le filtre JWT est exécuté avant le filtre d'authentification standard.</li>
 * </ul>
 *
 * <p>{@code @EnableMethodSecurity} active {@code @PreAuthorize} sur les controllers
 * pour un contrôle fin des autorisations.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * Chaîne de filtres de sécurité principale.
     *
     * @param http le builder de sécurité HTTP
     * @return la {@link SecurityFilterChain} configurée
     * @throws Exception en cas d'erreur de configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Applique la configuration CORS définie dans CorsConfig
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // Désactive CSRF : inutile pour une API REST sans session
            .csrf(AbstractHttpConfigurer::disable)

            // Règles d'autorisation des endpoints
            .authorizeHttpRequests(auth -> auth
                // Endpoints publics : authentification + actions visiteur
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()

                // Tout le reste nécessite un JWT valide
                .anyRequest().authenticated()
            )

            // API stateless : pas de session HTTP côté serveur
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Provider d'authentification basé sur UserDetailsService + BCrypt
            .authenticationProvider(authenticationProvider())

            // Insère le filtre JWT avant le filtre d'authentification standard
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Provider d'authentification DAO.
     * Utilise {@link UserDetailsService} pour charger l'utilisateur
     * et {@link BCryptPasswordEncoder} pour vérifier le mot de passe.
     *
     * @return le provider configuré
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Encodeur de mots de passe BCrypt (force par défaut : 10 rounds).
     *
     * @return {@link BCryptPasswordEncoder}
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Expose le {@link AuthenticationManager} pour l'utiliser dans {@link com.invitation.controller.AuthController}.
     *
     * @param config la configuration d'authentification Spring
     * @return l'AuthenticationManager
     * @throws Exception en cas d'erreur
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
