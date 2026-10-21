package com.meetup.repo;

import com.meetup.domain.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Newest first; the service reverses the page for display. */
    @EntityGraph(attributePaths = "sender")
    List<Message> findByConversationIdOrderByIdDesc(Long conversationId, Pageable page);

    @EntityGraph(attributePaths = "sender")
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long before, Pageable page);

    @EntityGraph(attributePaths = "sender")
    Optional<Message> findFirstByConversationIdOrderByIdDesc(Long conversationId);

    long countByConversationIdAndSenderIdNotAndCreatedAtAfter(Long conversationId, Long senderId, Instant after);
}
