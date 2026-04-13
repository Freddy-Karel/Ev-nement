package com.invitation.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service responsable de la génération, de l'extraction et de la validation des tokens JWT.
 *
 * <p>Algorithme utilisé : HMAC-SHA256 (HS256).</p>
 * <p>La clé secrète et la durée d'expiration sont injectées depuis {@code application.properties}.</p>
 */
@Service
public class JwtService {

    /** Clé secrète lue depuis {@code jwt.secret} (minimum 32 caractères pour HS256). */
    @Value("${jwt.secret}")
    private String secretKey;

    /** Durée de validité du token en millisecondes (ex : 86400000 = 24 h). */
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // =========================================================================
    // GÉNÉRATION
    // =========================================================================

    /**
     * Génère un token JWT signé pour l'email donné, sans claims supplémentaires.
     *
     * @param email le sujet du token (email de l'admin)
     * @return token JWT signé
     */
    public String generateToken(String email) {
        return generateToken(new HashMap<>(), email);
    }

    /**
     * Génère un token JWT avec des claims additionnels.
     *
     * @param extraClaims claims supplémentaires à inclure dans le payload
     * @param email       le sujet du token
     * @return token JWT signé
     */
    public String generateToken(Map<String, Object> extraClaims, String email) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())          // algorithme HS256 déduit automatiquement
                .compact();
    }

    // =========================================================================
    // EXTRACTION
    // =========================================================================

    /**
     * Extrait l'email (sujet) contenu dans le token.
     *
     * @param token le token JWT
     * @return l'email extrait
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrait la date d'expiration du token.
     *
     * @param token le token JWT
     * @return la date d'expiration
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Méthode générique pour extraire n'importe quel claim du token.
     *
     * @param token          le token JWT
     * @param claimsResolver fonction d'extraction du claim souhaité
     * @param <T>            type du claim retourné
     * @return la valeur du claim
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    /**
     * Vérifie qu'un token est valide pour un {@link UserDetails} donné.
     * <p>
     * Un token est valide si :
     * <ul>
     *   <li>Le sujet correspond à l'username de l'utilisateur ;</li>
     *   <li>Le token n'est pas expiré.</li>
     * </ul>
     *
     * @param token       le token JWT
     * @param userDetails les détails de l'utilisateur chargé depuis la base
     * @return {@code true} si le token est valide
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Construit la clé HMAC-SHA256 à partir de la clé secrète configurée.
     * Encode la chaîne en UTF-8 pour garantir la compatibilité multi-plateformes.
     * Retourne {@link SecretKey} (type requis par l'API jjwt 0.12.x).
     *
     * @return clé de signature {@link SecretKey}
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
