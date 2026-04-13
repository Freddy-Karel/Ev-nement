package com.invitation.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Garantit que la colonne {@code events.banner_url} accepte les images base64 longues.
 *
 * <p>Hibernate peut laisser une ancienne colonne {@code VARCHAR(255)} inchangée même si
 * l'entité JPA a déjà été mise à jour en {@code LONGTEXT}. Cette migration légère rend
 * le démarrage idempotent sur les bases déjà existantes.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventBannerColumnInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        if (!tableExists("events")) {
            log.debug("Table events absente au démarrage, migration banner_url ignorée.");
            return;
        }

        String dataType = jdbcTemplate.query(
                """
                SELECT DATA_TYPE
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'events'
                  AND COLUMN_NAME = 'banner_url'
                """,
                rs -> rs.next() ? rs.getString("DATA_TYPE") : null
        );

        if (dataType == null) {
            log.warn("Colonne events.banner_url introuvable, migration ignorée.");
            return;
        }

        if ("longtext".equalsIgnoreCase(dataType)) {
            log.debug("Colonne events.banner_url déjà en LONGTEXT.");
            return;
        }

        log.info("Migration de events.banner_url : {} -> LONGTEXT", dataType);
        jdbcTemplate.execute("ALTER TABLE events MODIFY COLUMN banner_url LONGTEXT NULL");
        log.info("Migration de events.banner_url terminée avec succès.");
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                """,
                Integer.class,
                tableName
        );

        return count != null && count > 0;
    }
}
