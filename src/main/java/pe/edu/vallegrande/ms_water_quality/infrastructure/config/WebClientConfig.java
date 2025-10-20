package pe.edu.vallegrande.ms_water_quality.infrastructure.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${user-service.base-url}")
    private String userServiceBaseUrl;

    @Value("${organization-service.base-url}")
    private String organizationServiceBaseUrl;

    @Value("${organization-service.token}")
    private String organizationServiceToken;

    @Bean
    @Qualifier("userWebClient")
    public WebClient userWebClient() {
        return WebClient.builder().baseUrl(userServiceBaseUrl).build();
    }

    @Bean
    @Qualifier("organizationWebClient")
    public WebClient organizationWebClient() {
        System.out.println("Organization service base URL: " + organizationServiceBaseUrl);
        System.out.println("Organization service token: " + organizationServiceToken);
        System.out.println("Token length: " + (organizationServiceToken != null ? organizationServiceToken.length() : "null"));
        
        return WebClient.builder()
                .baseUrl(organizationServiceBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + organizationServiceToken)
                .build();
    }
}