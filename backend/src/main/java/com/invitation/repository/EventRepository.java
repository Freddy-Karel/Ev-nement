package com.invitation.repository;

import com.invitation.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Spring Data JPA pour l'entité {@link Event}.
 */
@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * Retourne tous les événements triés du plus récent au plus ancien.
     * Utilisé pour l'affichage dans le tableau de bord admin.
     *
     * @return liste des événements triée par {@code createdAt} décroissant
     */
    List<Event> findAllByOrderByCreatedAtDesc();
}
