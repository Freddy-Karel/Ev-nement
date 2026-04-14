package com.invitation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuration CORS (Cross-Origin Resource Sharing).
 *
 * <p>Autorise le frontend React (Vite sur les ports 5173 et 3000)
 * à appeler l'API depuis un domaine différent.</p>
 *
 * <p>En production, restreindre {@code allowedOrigins} au domaine réel du frontend.</p>
 */
@Configuration
public class CorsConfig {

    /**
     * Définit la politique CORS appliquée à toutes les routes {@code /**}.
     *
     * @return la source de configuration CORS injectée dans {@link SecurityConfig}
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Origines autorisées : frontend React en développement + production
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",   // React CRA / serveur de dev générique
                "http://localhost:5173",   // Vite (port par défaut)
                "http://localhost:4173",   // Vite preview

                "http://192.168.*.*:3000", // LAN
                "http://192.168.*.*:5173", // LAN
                "http://192.168.*.*:4173", // LAN

                "http://10.*.*.*:3000",    // hotspot / réseau privé
                "http://10.*.*.*:5173",
                "http://10.*.*.*:4173",

                "http://172.16.*.*:3000",  // réseau privé
                "http://172.16.*.*:5173",
                "http://172.16.*.*:4173",

                "https://icc.ga"           // domaine de production (à adapter)
        ));

        // Méthodes HTTP autorisées
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // Headers autorisés dans les requêtes
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With"
        ));

        // Autorise l'envoi des cookies et du header Authorization
        config.setAllowCredentials(true);

        // Durée (en secondes) pendant laquelle le navigateur met en cache la réponse preflight
        config.setMaxAge(3600L);

        // Applique cette configuration à toutes les routes
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
