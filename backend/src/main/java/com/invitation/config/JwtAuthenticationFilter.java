package com.invitation.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre Spring Security exécuté une seule fois par requête HTTP.
 *
 * <p>Logique d'interception :</p>
 * <ol>
 *   <li>Lit le header {@code Authorization: Bearer <token>}.</li>
 *   <li>Extrait et valide le token JWT via {@link JwtService}.</li>
 *   <li>Charge l'utilisateur depuis {@link UserDetailsService}.</li>
 *   <li>Enregistre l'authentification dans le {@link SecurityContextHolder}.</li>
 * </ol>
 *
 * <p>Si le header est absent ou invalide, la requête continue sans authentification
 * (Spring Security gère ensuite le rejet si endpoint est protégé).</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Passe au filtre suivant si pas de header Bearer
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extrait le token (supprime le préfixe "Bearer ")
        final String jwt = authHeader.substring(7);

        try {
            final String userEmail = jwtService.extractEmail(jwt);

            // Traite l'authentification uniquement si l'email est extrait
            // et qu'aucune auth n'est déjà présente dans le contexte
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Crée le token d'authentification Spring Security
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,                          // credentials null car déjà authentifié via JWT
                                    userDetails.getAuthorities()
                            );

                    // Enrichit avec les détails de la requête (IP, session, etc.)
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Enregistre l'authentification dans le contexte de sécurité
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("Authentification JWT réussie pour : {}", userEmail);
                } else {
                    log.warn("Token JWT invalide ou expiré pour : {}", userEmail);
                }
            }
        } catch (Exception e) {
            // Token malformé ou signature invalide : on laisse passer sans authentifier
            log.error("Erreur lors du traitement du token JWT : {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
