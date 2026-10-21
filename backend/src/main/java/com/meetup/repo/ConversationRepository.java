package com.meetup.repo;

import com.meetup.domain.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @EntityGraph(attributePaths = "plan")
    Optional<Conversation> findWithPlanById(Long id);

    Optional<Conversation> findByPlanId(Long planId);

    Optional<Conversation> findByDirectKey(String directKey);
}
