package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.domain.Conversation;
import com.meetup.domain.ConversationMember;
import com.meetup.domain.JoinRequest;
import com.meetup.domain.Message;
import com.meetup.domain.Plan;
import com.meetup.repo.ConversationMemberRepository;
import com.meetup.repo.ConversationRepository;
import com.meetup.repo.JoinRequestRepository;
import com.meetup.repo.MessageRepository;
import com.meetup.repo.PlanRepository;
import com.meetup.repo.UserRepository;
import com.meetup.web.ApiException;
import com.meetup.web.ChatDtos.ConversationView;
import com.meetup.web.ChatDtos.MessageView;
import com.meetup.web.Dtos.UserView;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private static final int MAX_BODY = 1000;
    private static final int MAX_PAGE = 100;

    private final ConversationRepository conversations;
    private final ConversationMemberRepository members;
    private final MessageRepository messages;
    private final PlanRepository plans;
    private final JoinRequestRepository requests;
    private final UserRepository users;
    private final SendRateLimiter limiter;
    private final BlockService blocks;

    /** A saved message plus who else should be told about it. */
    public record Sent(MessageView message, List<Long> recipientIds) {
    }

    // ---- membership, driven by the plan lifecycle ----

    public void createPlanConversation(Plan plan) {
        ensurePlanConversation(plan);
    }

    public void addPlanMember(Plan plan, Long userId) {
        addMember(ensurePlanConversation(plan), users.getReferenceById(userId));
    }

    public void removePlanMember(Long planId, Long userId) {
        members.deleteByConversationPlanIdAndUserId(planId, userId);
    }

    // ---- opening conversations ----

    /** The group chat of a plan. Only the host and accepted guests may open it. */
    public ConversationView planConversation(Long planId, Long userId) {
        Plan plan = plans.findWithHostById(planId).orElseThrow(() -> ApiException.notFound("Plan not found"));
        boolean isHost = plan.getHost().getId().equals(userId);
        boolean accepted = requests.findByPlanIdAndUserId(planId, userId)
                .map(r -> r.getStatus() == JoinRequest.Status.ACCEPTED).orElse(false);
        if (!isHost && !accepted) {
            throw ApiException.forbidden("Only the host and accepted guests can join the chat");
        }
        // Self-heal for plans that predate chat: create the room and make sure this person is in it.
        Conversation conversation = ensurePlanConversation(plan);
        addMember(conversation, users.getReferenceById(userId));
        return get(conversation.getId(), userId);
    }

    /**
     * A private chat between two people. Allowed only when they are connected through a plan: one hosts
     * a plan the other asked to join, or both were accepted into the same plan.
     */
    public ConversationView openDirect(Long me, Long otherId) {
        if (me.equals(otherId)) {
            throw ApiException.badRequest("You can't message yourself");
        }
        AppUser other = users.findById(otherId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (blocks.isBlockedEitherWay(me, otherId)) {
            throw ApiException.forbidden("You can't message this user");
        }
        boolean connected = requests.existsHostLink(me, otherId)
                || requests.existsCoGuests(me, otherId) || requests.existsCoGuests(otherId, me);
        if (!connected) {
            throw ApiException.forbidden("You can only message people you share a plan with");
        }

        String key = Math.min(me, otherId) + ":" + Math.max(me, otherId);
        Conversation conversation = conversations.findByDirectKey(key).orElseGet(() -> {
            Conversation created = new Conversation(Conversation.Type.DIRECT);
            created.setDirectKey(key);
            conversations.save(created);
            addMember(created, users.getReferenceById(me));
            addMember(created, other);
            return created;
        });
        return get(conversation.getId(), me);
    }

    // ---- reading ----

    @Transactional(readOnly = true)
    public List<ConversationView> list(Long me) {
        List<ConversationMember> mine = members.findByUserId(me);
        if (mine.isEmpty()) {
            return List.of();
        }
        List<Long> ids = mine.stream().map(m -> m.getConversation().getId()).toList();
        Map<Long, List<ConversationMember>> byConversation = members.findByConversationIdIn(ids).stream()
                .collect(Collectors.groupingBy(m -> m.getConversation().getId()));

        List<ConversationView> views = new ArrayList<>();
        for (ConversationMember m : mine) {
            views.add(view(m.getConversation(), m, byConversation.get(m.getConversation().getId()), me));
        }
        views.sort(Comparator.comparing(
                (ConversationView v) -> v.lastMessage() != null ? v.lastMessage().createdAt() : Instant.EPOCH,
                Comparator.reverseOrder()));
        return views;
    }

    @Transactional(readOnly = true)
    public ConversationView get(Long conversationId, Long me) {
        ConversationMember mine = requireMember(conversationId, me);
        Conversation conversation = conversations.findWithPlanById(conversationId).orElseThrow();
        return view(conversation, mine, members.findByConversationId(conversationId), me);
    }

    /** Oldest-first page of messages; pass the id of the oldest one you have as {@code before} to go back. */
    @Transactional(readOnly = true)
    public List<MessageView> history(Long conversationId, Long me, Long before, int limit) {
        requireMember(conversationId, me);
        PageRequest page = PageRequest.of(0, Math.max(1, Math.min(limit, MAX_PAGE)));
        List<Message> found = before == null
                ? messages.findByConversationIdOrderByIdDesc(conversationId, page)
                : messages.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, before, page);
        List<MessageView> result = new ArrayList<>(found.stream().map(ChatService::messageView).toList());
        Collections.reverse(result);
        return result;
    }

    // ---- writing ----

    public Sent send(Long conversationId, Long me, String body) {
        limiter.check(me);
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw ApiException.badRequest("Message is empty");
        }
        if (text.length() > MAX_BODY) {
            throw ApiException.badRequest("Message is too long (max " + MAX_BODY + " characters)");
        }
        ConversationMember sender = requireMember(conversationId, me);
        Conversation conversation = sender.getConversation();
        if (conversation.getType() == Conversation.Type.DIRECT) {
            Long otherId = members.findByConversationId(conversationId).stream()
                    .map(m -> m.getUser().getId()).filter(id -> !id.equals(me)).findFirst().orElse(null);
            if (otherId != null && blocks.isBlockedEitherWay(me, otherId)) {
                throw ApiException.forbidden("You can't message this user");
            }
        }
        Message saved = messages.save(new Message(sender.getConversation(), sender.getUser(), text));
        sender.setLastReadAt(saved.getCreatedAt());

        List<Long> recipients = members.findByConversationId(conversationId).stream()
                .map(m -> m.getUser().getId())
                .filter(id -> !id.equals(me))
                .toList();
        return new Sent(messageView(saved), recipients);
    }

    public void markRead(Long conversationId, Long me) {
        requireMember(conversationId, me).setLastReadAt(Instant.now());
    }

    /** Used by the WebSocket layer to authorise subscriptions. */
    @Transactional(readOnly = true)
    public boolean isMember(Long conversationId, Long userId) {
        return members.existsByConversationIdAndUserId(conversationId, userId);
    }

    // ---- helpers ----

    private Conversation ensurePlanConversation(Plan plan) {
        return conversations.findByPlanId(plan.getId()).orElseGet(() -> {
            Conversation created = new Conversation(Conversation.Type.PLAN);
            created.setPlan(plan);
            conversations.save(created);
            addMember(created, plan.getHost());
            return created;
        });
    }

    private void addMember(Conversation conversation, AppUser user) {
        if (!members.existsByConversationIdAndUserId(conversation.getId(), user.getId())) {
            members.save(new ConversationMember(conversation, user));
        }
    }

    private ConversationMember requireMember(Long conversationId, Long userId) {
        return members.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> ApiException.forbidden("You are not part of this conversation"));
    }

    private ConversationView view(Conversation c, ConversationMember mine, List<ConversationMember> all, Long me) {
        AppUser other = null;
        if (c.getType() == Conversation.Type.DIRECT && all != null) {
            other = all.stream().map(ConversationMember::getUser).filter(u -> !u.getId().equals(me)).findFirst().orElse(null);
        }
        String title = c.getType() == Conversation.Type.PLAN
                ? c.getPlan().getTitle()
                : other != null ? other.getDisplayName() : "Conversation";

        MessageView last = messages.findFirstByConversationIdOrderByIdDesc(c.getId())
                .map(ChatService::messageView).orElse(null);
        long unread = messages.countByConversationIdAndSenderIdNotAndCreatedAtAfter(c.getId(), me, mine.getLastReadAt());
        boolean blocked = other != null && blocks.isBlockedEitherWay(me, other.getId());

        return new ConversationView(c.getId(), c.getType(), title,
                c.getPlan() != null ? c.getPlan().getId() : null,
                other != null ? new UserView(other.getId(), other.getDisplayName()) : null,
                last, unread, blocked);
    }

    private static MessageView messageView(Message m) {
        return new MessageView(m.getId(), m.getConversation().getId(),
                new UserView(m.getSender().getId(), m.getSender().getDisplayName()), m.getBody(), m.getCreatedAt());
    }
}
