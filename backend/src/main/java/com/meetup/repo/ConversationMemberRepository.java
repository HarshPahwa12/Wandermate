package com.meetup.repo;

import com.meetup.domain.ConversationMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);

    @EntityGraph(attributePaths = {"conversation", "user"})
    Optional<ConversationMember> findByConversationIdAndUserId(Long conversationId, Long userId);

    @EntityGraph(attributePaths = {"conversation", "conversation.plan"})
    List<ConversationMember> findByUserId(Long userId);

    @EntityGraph(attributePaths = "user")
    List<ConversationMember> findByConversationId(Long conversationId);

    @EntityGraph(attributePaths = "user")
    List<ConversationMember> findByConversationIdIn(Collection<Long> conversationIds);

    void deleteByConversationPlanIdAndUserId(Long planId, Long userId);
}
