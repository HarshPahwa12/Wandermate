package com.meetup.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MailService {

    private final ObjectProvider<JavaMailSender> senderProvider;
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> senderProvider, @Value("${app.mail.from}") String from) {
        this.senderProvider = senderProvider;
        this.from = from;
    }

    public void send(String to, String subject, String body) {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            // Dev fallback: no SMTP configured, so the email (and any reset link in it) just goes to the log.
            log.info("[DEV MAIL] to={} subject={}\n{}", to, subject, body);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        sender.send(message);
    }
}
