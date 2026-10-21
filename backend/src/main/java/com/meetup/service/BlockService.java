package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.domain.BlockedUser;
import com.meetup.repo.BlockedUserRepository;
import com.meetup.repo.UserRepository;
import com.meetup.web.ApiException;
import com.meetup.web.Dtos.UserView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class BlockService {

    private final BlockedUserRepository blocks;
    private final UserRepository users;

    public void block(Long blockerId, Long targetId) {
        if (blockerId.equals(targetId)) {
            throw ApiException.badRequest("You can't block yourself");
        }
        if (blocks.findByBlockerIdAndBlockedId(blockerId, targetId).isPresent()) {
            return; // already blocked
        }
        AppUser blocker = users.getReferenceById(blockerId);
        AppUser target = users.findById(targetId).orElseThrow(() -> ApiException.notFound("User not found"));
        blocks.save(new BlockedUser(blocker, target));
    }

    public void unblock(Long blockerId, Long targetId) {
        blocks.findByBlockerIdAndBlockedId(blockerId, targetId).ifPresent(blocks::delete);
    }

    @Transactional(readOnly = true)
    public List<UserView> listBlocked(Long blockerId) {
        return blocks.findByBlockerIdOrderByCreatedAtDesc(blockerId).stream()
                .map(b -> new UserView(b.getBlocked().getId(), b.getBlocked().getDisplayName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(Long a, Long b) {
        return blocks.existsEitherDirection(a, b);
    }

    /** Every user id that {@code userId} has blocked, or that has blocked {@code userId}. */
    @Transactional(readOnly = true)
    public Set<Long> relatedBlockIds(Long userId) {
        return new HashSet<>(blocks.findRelatedUserIds(userId));
    }
}
