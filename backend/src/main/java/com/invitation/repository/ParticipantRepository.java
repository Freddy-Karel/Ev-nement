package com.invitation.repository;

import com.invitation.model.Participant;
import com.invitation.model.enums.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository Spring Data JPA pour l'entité {@link Participant}.
 */
@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    /**
     * Retourne les participants d'un événement filtrés par statut.
     * Utilisé pour obtenir les listes PENDING, CONFIRMED, INVITED.
     *
     * @param eventId identifiant de l'événement
     * @param status  statut à filtrer
     * @return liste des participants correspondants
     */
    List<Participant> findByEventIdAndStatus(Long eventId, ParticipantStatus status);

    /**
     * Recherche un participant par son token de confirmation (UUID).
     * Utilisé lors de la confirmation via le lien envoyé par email.
     *
     * @param token le token UUID unique
     * @return un {@link Optional} contenant le participant s'il existe
     */
    Optional<Participant> findByToken(String token);

    /**
     * Vérifie si un email est déjà enregistré pour un événement donné.
     * Utilisé pour prévenir les doublons (retourne 409 Conflict).
     *
     * @param eventId identifiant de l'événement
     * @param email   email à vérifier
     * @return {@code true} si l'email existe déjà pour cet événement
     */
    boolean existsByEventIdAndEmail(Long eventId, String email);

    /**
     * Retourne tous les participants d'un événement, tous statuts confondus.
     * Utilisé pour l'export CSV global.
     *
     * @param eventId identifiant de l'événement
     * @return liste complète des participants de l'événement
     */
    List<Participant> findByEventId(Long eventId);

    /**
     * Retourne les invités nominatifs d'un événement dont le statut est précisé.
     * Typiquement utilisé pour lister les INVITED (invitations non encore confirmées).
     *
     * @param eventId        identifiant de l'événement
     * @param status         statut à filtrer (généralement INVITED)
     * @return liste des invités nominatifs correspondants
     */
    List<Participant> findByEventIdAndInvitedByAdminTrueAndStatus(Long eventId, ParticipantStatus status);

    /**
     * Supprime tous les participants liés à un événement.
     * Utilisé lors de la suppression d'un événement.
     *
     * @param eventId identifiant de l'événement
     */
    @Modifying
    @Query("DELETE FROM Participant p WHERE p.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);

    /**
     * Retourne tous les enregistrements d'un participant via son email (tous événements).
     * Utilisé par le dashboard ambassadeur pour lister les événements auxquels il est inscrit.
     *
     * @param email email du participant
     * @return liste de toutes ses participations
     */
    List<Participant> findByEmail(String email);
}
