package com.invitation.service;

import com.invitation.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service de génération de tokens uniques pour les invitations nominatives.
 *
 * <p>Chaque token est un UUID aléatoire (128 bits, ~3.4×10³⁸ valeurs possibles),
 * ce qui rend la devinette par force brute pratiquement impossible.</p>
 *
 * <p>Une vérification d'unicité en base est effectuée pour couvrir le cas théorique
 * de collision UUID, même si la probabilité est infime (~10⁻¹⁸).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private final ParticipantRepository participantRepository;

    /**
     * Génère un token UUID garanti unique dans la table {@code participants}.
     *
     * <p>En pratique, la boucle n'itère qu'une seule fois. La vérification
     * d'unicité est une précaution défensive.</p>
     *
     * @return un token UUID sous forme de chaîne (ex: "550e8400-e29b-41d4-a716-446655440000")
     */
    public String generateUniqueToken() {
        String token;
        int attempts = 0;

        do {
            token = UUID.randomUUID().toString();
            attempts++;
            if (attempts > 1) {
                log.warn("Collision de token UUID détectée à la tentative {} — génération d'un nouveau token", attempts);
            }
        } while (participantRepository.findByToken(token).isPresent());

        log.debug("Token unique généré en {} tentative(s)", attempts);
        return token;
    }
}
