package com.invitation.service;

import com.invitation.dto.request.InviteRequest;
import com.invitation.dto.request.PublicRegistrationRequest;
import com.invitation.dto.response.ConfirmationResponse;
import com.invitation.dto.response.InvitationResponse;
import com.invitation.dto.response.ParticipantResponse;
import com.invitation.exception.DuplicateEmailException;
import com.invitation.exception.ResourceNotFoundException;
import com.invitation.model.Event;
import com.invitation.model.User;
import com.invitation.model.Participant;
import com.invitation.dto.EventTicketTypeDTO;
import com.invitation.model.enums.ParticipantStatus;
import com.invitation.model.enums.Role;
import com.invitation.repository.UserRepository;
import com.invitation.repository.ParticipantRepository;
import com.invitation.utils.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Service central gérant le cycle de vie des participants.
 *
 * <p>Orchestre les flux suivants :</p>
 * <ul>
 *   <li>Invitation nominative admin → statut {@code INVITED}</li>
 *   <li>Inscription publique visiteur → statut {@code PENDING}</li>
 *   <li>Validation / refus admin → {@code CONFIRMED} / {@code REJECTED}</li>
 *   <li>Confirmation par token → {@code INVITED} → {@code CONFIRMED}</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipantService {

    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final EventService eventService;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.confirmation-url}")
    private String confirmationBaseUrl;

    // =========================================================================
    // INVITATION NOMINATIVE (admin)
    // =========================================================================

    /**
     * Crée une invitation nominative pour un événement donné.
     *
     * <ol>
     *   <li>Vérifie l'unicité de l'email pour cet événement.</li>
     *   <li>Génère un token UUID unique.</li>
     *   <li>Crée le participant avec le statut {@code INVITED}.</li>
     *   <li>Simule l'envoi de l'email d'invitation.</li>
     *   <li>Retourne les données nécessaires au frontend pour générer la carte.</li>
     * </ol>
     *
     * @param eventId identifiant de l'événement
     * @param request données de l'invité (prénom, email, téléphone)
     * @return {@link InvitationResponse} contenant toutes les données pour la carte
     * @throws ResourceNotFoundException si l'événement n'existe pas
     * @throws DuplicateEmailException   si l'email est déjà enregistré pour cet événement
     */
    @Transactional
    public InvitationResponse inviteParticipant(Long eventId, InviteRequest request) {
        Long safeEventId = Objects.requireNonNull(eventId, "L'identifiant de l'événement est obligatoire");
        log.info("Création d'une invitation pour {} <{}> à l'événement id={}",
                request.getFirstName(), request.getEmail(), safeEventId);

        Event event = Objects.requireNonNull(
                eventService.findEventEntityById(safeEventId),
                "L'événement cible ne peut pas être null"
        );
        checkDuplicateEmail(safeEventId, request.getEmail());

        String token = tokenService.generateUniqueToken();

        Participant participant = Objects.requireNonNull(Participant.builder()
                .event(event)
                .firstName(request.getFirstName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .status(ParticipantStatus.INVITED)
                .token(token)
                .invitedByAdmin(true)
                .build(), "Le participant invité ne peut pas être null");

        Participant saved = Objects.requireNonNull(
                participantRepository.save(participant),
                "Le participant sauvegardé ne peut pas être null"
        );
        log.info("Participant INVITED créé, id={}, token={}", saved.getId(), token);

        String confirmationUrl = confirmationBaseUrl + "/" + token;

        // Simulation de l'envoi email
        emailService.sendInvitation(
                saved.getEmail(),
                saved.getFirstName(),
                event.getTitle(),
                confirmationUrl
        );

        return DtoMapper.toInvitationResponse(saved, event, confirmationBaseUrl);
    }

    // =========================================================================
    // INSCRIPTION PUBLIQUE (visiteur)
    // =========================================================================

    /**
     * Enregistre une inscription publique soumise par un visiteur.
     *
     * <ol>
     *   <li>Vérifie l'unicité de l'email pour cet événement.</li>
     *   <li>Crée le participant avec le statut {@code PENDING} (pas de token).</li>
     *   <li>Envoie un email informant l'attente de validation.</li>
     * </ol>
     *
     * @param eventId identifiant de l'événement
     * @param request données du participant (prénom, email, téléphone)
     * @return {@link ParticipantResponse} du participant créé
     * @throws ResourceNotFoundException si l'événement n'existe pas
     * @throws DuplicateEmailException   si l'email est déjà enregistré pour cet événement
     */
    @Transactional
    public ParticipantResponse registerPublic(Long eventId, PublicRegistrationRequest request) {
        Long safeEventId = Objects.requireNonNull(eventId, "L'identifiant de l'événement est obligatoire");
        log.info("Inscription publique de {} <{}> pour l'événement id={}",
                request.getFirstName(), request.getEmail(), safeEventId);

        Event event = Objects.requireNonNull(
                eventService.findEventEntityById(safeEventId),
                "L'événement cible ne peut pas être null"
        );
        checkDuplicateEmail(safeEventId, request.getEmail());

        // Résolution du type de billet (String dynamique, plus d'enum)
        // requestedType est effectively final → utilisable dans le lambda du stream
        final String requestedType = (request.getTicketType() != null && !request.getTicketType().isBlank())
                ? request.getTicketType().toUpperCase()
                : "STANDARD";

        // Lookup du prix depuis la configuration de l'événement
        String ticketTypeName = requestedType;
        Integer ticketPrice = null;
        List<EventTicketTypeDTO> eventTicketTypes = event.getTicketTypes();
        if (eventTicketTypes != null && !eventTicketTypes.isEmpty()) {
            EventTicketTypeDTO matched = eventTicketTypes.stream()
                    .filter(t -> requestedType.equalsIgnoreCase(t.getName()))
                    .findFirst()
                    .orElse(null);
            if (matched != null) {
                ticketPrice = matched.getPrice();
            } else {
                // Type demandé inexistant → fallback sur le premier type de la config
                EventTicketTypeDTO fallback = eventTicketTypes.get(0);
                ticketTypeName = fallback.getName();
                ticketPrice    = fallback.getPrice();
            }
        }

        Participant participant = Objects.requireNonNull(Participant.builder()
                .event(event)
                .firstName(request.getFirstName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .status(ParticipantStatus.PENDING)
                .token(null)          // pas de token pour les inscriptions publiques
                .invitedByAdmin(false)
                .ticketType(ticketTypeName)
                .ticketPrice(ticketPrice)
                .build(), "Le participant public ne peut pas être null");

        Participant saved = Objects.requireNonNull(
                participantRepository.save(participant),
                "Le participant sauvegardé ne peut pas être null"
        );
        log.info("Participant PENDING créé, id={}", saved.getId());

        // Créer un compte Ambassadeur automatiquement s'il n'existe pas
        if (!userRepository.existsByEmail(request.getEmail())) {
            String tempPassword = generateSecurePassword();
            User newUser = User.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(tempPassword))
                    .firstName(request.getFirstName())
                    .lastName("")
                    .role(Role.AMBASSADOR)
                    .build();
            userRepository.save(Objects.requireNonNull(newUser, "User cannot be null"));
            log.info("Compte ambassadeur auto-créé : {}", newUser.getEmail());
            // Envoyer l'email de bienvenue avec les identifiants (non-bloquant)
            try {
                emailService.sendAmbassadorWelcome(newUser.getEmail(), newUser.getFirstName(), tempPassword);
            } catch (Exception ex) {
                log.warn("Email Ambassadeur non envoyé pour {} : {}", newUser.getEmail(), ex.getMessage());
            }
        }

        emailService.sendPendingConfirmation(
                saved.getEmail(),
                saved.getFirstName(),
                event.getTitle()
        );

        return DtoMapper.toParticipantResponse(saved);
    }

    private String generateSecurePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    // =========================================================================
    // LISTES (admin)
    // =========================================================================

    /**
     * Retourne les participants d'un événement filtrés par statut.
     *
     * @param eventId identifiant de l'événement
     * @param status  statut à filtrer
     * @return liste des participants correspondants
     */
    @Transactional(readOnly = true)
    public List<ParticipantResponse> getParticipantsByStatus(Long eventId, ParticipantStatus status) {
        return participantRepository.findByEventIdAndStatus(eventId, status)
                .stream()
                .map(DtoMapper::toParticipantResponse)
                .toList();
    }

    /**
     * Retourne les participants confirmés d'un événement.
     *
     * @param eventId identifiant de l'événement
     * @return liste des participants avec le statut {@code CONFIRMED}
     */
    @Transactional(readOnly = true)
    public List<ParticipantResponse> getConfirmedParticipants(Long eventId) {
        return getParticipantsByStatus(eventId, ParticipantStatus.CONFIRMED);
    }

    /**
     * Retourne les inscriptions publiques en attente de validation.
     *
     * @param eventId identifiant de l'événement
     * @return liste des participants avec le statut {@code PENDING}
     */
    @Transactional(readOnly = true)
    public List<ParticipantResponse> getPendingParticipants(Long eventId) {
        return getParticipantsByStatus(eventId, ParticipantStatus.PENDING);
    }

    /**
     * Retourne les invités nominatifs n'ayant pas encore confirmé leur présence.
     *
     * @param eventId identifiant de l'événement
     * @return liste des invités avec le statut {@code INVITED}
     */
    @Transactional(readOnly = true)
    public List<ParticipantResponse> getInvitedNotConfirmed(Long eventId) {
        return participantRepository
                .findByEventIdAndInvitedByAdminTrueAndStatus(eventId, ParticipantStatus.INVITED)
                .stream()
                .map(DtoMapper::toParticipantResponse)
                .toList();
    }

    // =========================================================================
    // VALIDATION / REFUS (admin)
    // =========================================================================

    /**
     * Valide une inscription publique : {@code PENDING} → {@code CONFIRMED}.
     * Envoie un email de confirmation au participant.
     *
     * @param participantId identifiant du participant
     * @return le participant mis à jour
     * @throws ResourceNotFoundException si le participant n'existe pas
     * @throws IllegalStateException     si le participant n'est pas en statut {@code PENDING}
     */
    @Transactional
    public ParticipantResponse validateParticipant(Long participantId) {
        Participant participant = findParticipantById(participantId);

        if (participant.getStatus() != ParticipantStatus.PENDING) {
            throw new IllegalStateException(
                    "Seul un participant PENDING peut être validé. Statut actuel : "
                    + participant.getStatus()
            );
        }

        participant.setStatus(ParticipantStatus.CONFIRMED);
        participant.setConfirmedAt(LocalDateTime.now());
        Participant updated = Objects.requireNonNull(
                participantRepository.save(participant),
                "Le participant validé ne peut pas être null"
        );

        log.info("Participant id={} validé → CONFIRMED", participantId);

        emailService.sendValidationConfirmation(
                updated.getEmail(),
                updated.getFirstName(),
                updated.getEvent().getTitle()
        );

        return DtoMapper.toParticipantResponse(updated);
    }

    /**
     * Refuse une inscription publique : {@code PENDING} → {@code REJECTED}.
     * Envoie un email de refus au participant.
     *
     * @param participantId identifiant du participant
     * @return le participant mis à jour
     * @throws ResourceNotFoundException si le participant n'existe pas
     * @throws IllegalStateException     si le participant n'est pas en statut {@code PENDING}
     */
    @Transactional
    public ParticipantResponse rejectParticipant(Long participantId) {
        Participant participant = findParticipantById(participantId);

        if (participant.getStatus() != ParticipantStatus.PENDING) {
            throw new IllegalStateException(
                    "Seul un participant PENDING peut être refusé. Statut actuel : "
                    + participant.getStatus()
            );
        }

        participant.setStatus(ParticipantStatus.REJECTED);
        Participant updated = Objects.requireNonNull(
                participantRepository.save(participant),
                "Le participant refusé ne peut pas être null"
        );

        log.info("Participant id={} refusé → REJECTED", participantId);

        emailService.sendRejectionEmail(
                updated.getEmail(),
                updated.getFirstName(),
                updated.getEvent().getTitle()
        );

        return DtoMapper.toParticipantResponse(updated);
    }

    /**
     * Supprime définitivement un participant.
     *
     * @param participantId identifiant du participant
     * @throws ResourceNotFoundException si le participant n'existe pas
     */
    @Transactional
    @SuppressWarnings("null")
    public void deleteParticipant(Long participantId) {
        Long safeId = Objects.requireNonNull(participantId, "L'identifiant du participant est obligatoire");
        Participant participant = findParticipantById(safeId);
        participantRepository.delete(participant);
        log.info("Participant id={} supprimé définitivement", safeId);
    }

    // =========================================================================
    // RENVOI D'INVITATION (admin)
    // =========================================================================

    /**
     * Renvoie les données de l'invitation à un invité nominatif qui n'a pas confirmé.
     * Simule le renvoi de l'email avec le lien de confirmation.
     *
     * @param participantId identifiant du participant
     * @return {@link InvitationResponse} avec les données complètes pour la carte
     * @throws ResourceNotFoundException si le participant n'existe pas
     * @throws IllegalStateException     si le participant n'est pas en statut {@code INVITED}
     */
    @Transactional(readOnly = true)
    public InvitationResponse resendInvitation(Long participantId) {
        Participant participant = findParticipantById(participantId);

        if (participant.getStatus() != ParticipantStatus.INVITED) {
            throw new IllegalStateException(
                    "Le renvoi d'invitation est réservé aux participants INVITED. Statut : "
                    + participant.getStatus()
            );
        }

        Event event = participant.getEvent();
        String confirmationUrl = confirmationBaseUrl + "/" + participant.getToken();

        log.info("Renvoi de l'invitation pour {} <{}>, événement '{}'",
                participant.getFirstName(), participant.getEmail(), event.getTitle());

        emailService.resendInvitationEmail(
                participant.getEmail(),
                participant.getFirstName(),
                event.getTitle(),
                confirmationUrl
        );

        return DtoMapper.toInvitationResponse(participant, event, confirmationBaseUrl);
    }

    /**
     * Retourne les données de carte d'un participant invité nominativement sans renvoyer d'email.
     *
     * @param participantId identifiant du participant
     * @return {@link InvitationResponse} pour l'aperçu/téléchargement de carte
     * @throws ResourceNotFoundException si le participant n'existe pas
     * @throws IllegalStateException si le participant n'a pas de token de confirmation exploitable
     */
    @Transactional(readOnly = true)
    public InvitationResponse getInvitationCard(Long participantId) {
        Participant participant = findParticipantById(participantId);

        if (!participant.isInvitedByAdmin() || participant.getToken() == null || participant.getToken().isBlank()) {
            throw new IllegalStateException(
                    "Aucune carte d'invitation n'est disponible pour ce participant."
            );
        }

        return DtoMapper.toInvitationResponse(participant, participant.getEvent(), confirmationBaseUrl);
    }

    /**
     * Retourne les données de carte pour UN ambassadeur connecté et UNE inscription.
     * Fonctionne pour les inscriptions nominatives (token) ET publiques (CONFIRMED).
     * Sécurité : vérifie que l'email correspond bien à l'utilisateur connecté.
     *
     * @param participantId  identifiant de la participation
     * @param authenticatedEmail email de l'ambassadeur connecté (JWT)
     * @return {@link InvitationResponse} pour l'affichage/téléchargement de la carte
     * @throws IllegalStateException     si la participation n'appartient pas à cet utilisateur
     * @throws ResourceNotFoundException si le participant n'existe pas
     */
    @Transactional(readOnly = true)
    public InvitationResponse getCardForAmbassador(Long participantId, String authenticatedEmail) {
        Participant participant = findParticipantById(participantId);

        // Vérification d'appartenance : sécurité anti-IDOR
        if (!participant.getEmail().equalsIgnoreCase(authenticatedEmail)) {
            throw new IllegalStateException("Cette carte ne vous appartient pas.");
        }

        // Pour les invitations nominatives : utiliser le token existant
        if (participant.isInvitedByAdmin() && participant.getToken() != null && !participant.getToken().isBlank()) {
            return DtoMapper.toInvitationResponse(participant, participant.getEvent(), confirmationBaseUrl);
        }

        // Pour les inscriptions publiques CONFIRMED : générer une carte de confirmation
        // QR code = identifiant unique de présence (participantId + email haché)
        String qrData = "CONFIRM-" + participant.getId() + "-" + participant.getEmail().hashCode();
        Event event = participant.getEvent();

        return InvitationResponse.builder()
                .participantId(participant.getId())
                .firstName(participant.getFirstName())
                .event(DtoMapper.toEventResponse(event))
                .confirmationUrl(qrData)        // sert de donnée pour le QR code
                .qrCodeData(qrData)
                .status(participant.getStatus())
                .ticketType(participant.getTicketType())
                .build();
    }

    // =========================================================================
    // CONFIRMATION PAR TOKEN (public)
    // =========================================================================

    /**
     * Confirme la présence d'un invité nominatif via son token unique.
     * Transition : {@code INVITED} → {@code CONFIRMED}.
     *
     * @param token le token UUID extrait du lien de confirmation
     * @return {@link ConfirmationResponse} avec un message personnalisé
     * @throws ResourceNotFoundException si le token est inconnu
     * @throws IllegalStateException     si le participant n'est plus en statut {@code INVITED}
     */
    @Transactional
    public ConfirmationResponse confirmByToken(String token) {
        log.info("Confirmation par token : {}", token);

        Participant participant = participantRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lien de confirmation invalide ou expiré."
                ));

        if (participant.getStatus() == ParticipantStatus.CONFIRMED) {
            // Idempotent : déjà confirmé, retourner un message sans erreur
            Event event = participant.getEvent();
            String confirmationUrl = confirmationBaseUrl + "/" + participant.getToken();
            return ConfirmationResponse.builder()
                    .success(true)
                    .participantId(participant.getId())
                    .participantFirstName(participant.getFirstName())
                    .message("Votre présence à " + event.getTitle() + " est déjà confirmée, "
                             + participant.getFirstName() + " !")
                    .eventTitle(event.getTitle())
                    .eventDates(formatEventDates(event))
                    .eventLocation(event.getLocation())
                    .eventStartDate(event.getStartDate() != null ? event.getStartDate().toString() : null)
                    .eventEndDate(event.getEndDate()   != null ? event.getEndDate().toString()   : null)
                    .confirmationUrl(confirmationUrl)
                    .qrCodeData(confirmationUrl)
                    .eventId(event.getId())
                    .ticketType(participant.getTicketType())
                    .build();
        }

        if (participant.getStatus() != ParticipantStatus.INVITED) {
            throw new IllegalStateException(
                    "Ce lien de confirmation n'est plus valide."
            );
        }

        participant.setStatus(ParticipantStatus.CONFIRMED);
        participant.setConfirmedAt(LocalDateTime.now());
        participantRepository.save(Objects.requireNonNull(participant, "Le participant confirmé ne peut pas être null"));

        Event event = participant.getEvent();
        String confirmationUrl = confirmationBaseUrl + "/" + participant.getToken();
        log.info("Participant {} <{}> confirmé via token pour '{}'",
                participant.getFirstName(), participant.getEmail(), event.getTitle());

        return ConfirmationResponse.builder()
                .success(true)
                .participantId(participant.getId())
                .participantFirstName(participant.getFirstName())
                .message("Félicitations " + participant.getFirstName()
                         + ", votre présence à " + event.getTitle() + " est confirmée !")
                .eventTitle(event.getTitle())
                .eventDates(formatEventDates(event))
                .eventLocation(event.getLocation())
                .eventStartDate(event.getStartDate() != null ? event.getStartDate().toString() : null)
                .eventEndDate(event.getEndDate()   != null ? event.getEndDate().toString()   : null)
                .confirmationUrl(confirmationUrl)
                .qrCodeData(confirmationUrl)
                .eventId(event.getId())
                .ticketType(participant.getTicketType())
                .build();
    }

    // =========================================================================
    // VÉRIFICATION DOUBLON (usage interne)
    // =========================================================================

    /**
     * Vérifie qu'un email n'est pas déjà enregistré pour un événement donné.
     *
     * @param eventId identifiant de l'événement
     * @param email   email à vérifier
     * @throws DuplicateEmailException si l'email existe déjà pour cet événement
     */
    public void checkDuplicateEmail(Long eventId, String email) {
        if (participantRepository.existsByEventIdAndEmail(eventId, email)) {
            log.warn("Tentative de doublon d'email '{}' pour l'événement id={}", email, eventId);
            throw new DuplicateEmailException(email, eventId);
        }
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Charge un participant par son id ou lève une {@link ResourceNotFoundException}.
     */
    private Participant findParticipantById(Long id) {
        Long participantId = Objects.requireNonNull(id, "L'identifiant du participant est obligatoire");
        return participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", participantId));
    }

    /**
     * Formate les dates d'un événement en chaîne lisible.
     *
     * <p>Exemple : "du 09 au 12 avril 2026"</p>
     *
     * @param event l'événement dont on formate les dates
     * @return chaîne de dates formatée
     */
    private String formatEventDates(Event event) {
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd");
        DateTimeFormatter fullFormatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);

        String startDay = event.getStartDate().format(dayFormatter);
        String endFull  = event.getEndDate().format(fullFormatter);

        return "du " + startDay + " au " + endFull;
    }
}
