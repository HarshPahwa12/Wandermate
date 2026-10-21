package com.meetup.service;

import com.meetup.domain.AppUser;
import com.meetup.domain.Plan;
import com.meetup.domain.Report;
import com.meetup.repo.PlanRepository;
import com.meetup.repo.ReportRepository;
import com.meetup.repo.UserRepository;
import com.meetup.web.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reports;
    private final UserRepository users;
    private final PlanRepository plans;

    public void report(Long reporterId, Long reportedId, Long planId, String reason) {
        if (reporterId.equals(reportedId)) {
            throw ApiException.badRequest("You can't report yourself");
        }
        AppUser reporter = users.getReferenceById(reporterId);
        AppUser reported = users.findById(reportedId).orElseThrow(() -> ApiException.notFound("User not found"));
        Plan plan = planId == null ? null : plans.findById(planId).orElse(null);
        reports.save(new Report(reporter, reported, plan, reason.trim()));
    }
}
