package com.invitation.repository;

import com.invitation.model.Speaker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository JPA pour les orateurs.
 */
@Repository
public interface SpeakerRepository extends JpaRepository<Speaker, Long> {

    /** Retourne les orateurs d'un événement triés par ordre d'affichage. */
    List<Speaker> findByEventIdOrderByDisplayOrderAsc(Long eventId);

    /** Supprime tous les orateurs d'un événement (lors de la suppression de l'événement). */
    void deleteByEventId(Long eventId);
}
