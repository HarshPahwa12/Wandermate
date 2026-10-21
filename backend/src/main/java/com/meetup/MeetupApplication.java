package com.meetup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.mail.autoconfigure.MailSenderAutoConfiguration;

/**
 * Mail autoconfiguration is excluded: we build our own {@link org.springframework.mail.javamail.JavaMailSender}
 * bean (see {@code MailConfig}) that is simply absent when no SMTP host is configured, so password-reset
 * emails fall back to being logged instead of failing to start or failing to send.
 */
@SpringBootApplication(exclude = MailSenderAutoConfiguration.class)
public class MeetupApplication {

	public static void main(String[] args) {
		SpringApplication.run(MeetupApplication.class, args);
	}

}
