package pe.edu.vallegrande.ms_water_quality.infrastructure.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalUser;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.UserApiResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.ResponseDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class ExternalServiceClient {

    private final WebClient userWebClient;
    private final WebClient organizationWebClient;

    public ExternalServiceClient(
            @Qualifier("userWebClient") WebClient userWebClient,
            @Qualifier("organizationWebClient") WebClient organizationWebClient) {
        this.userWebClient = userWebClient;
        this.organizationWebClient = organizationWebClient;
    }

    public Flux<ExternalUser> getAdminsByOrganization(String organizationId) {
        return userWebClient.get()
                .uri("/internal/organizations/" + organizationId + "/admins")
                .retrieve()
                .bodyToMono(UserApiResponse.class)
                .flatMapMany(response -> Flux.fromIterable(response.getData()))
                .onErrorResume(e -> {
                    System.err.println("Error fetching admins for organization " + organizationId + ": " + e.getMessage());
                    return Flux.empty();
                });
    }

    public Mono<ExternalUser> getUserById(String userId) {
        return userWebClient.get()
                .uri("/api/users/" + userId)
                .retrieve()
                .bodyToMono(ResponseDto.class)
                .map(response -> (ExternalUser) response.getData())
                .onErrorResume(e -> {
                    System.err.println("Error fetching user " + userId + ": " + e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<ExternalOrganization> getOrganizationById(String organizationId) {
        // Instead of calling the organization service directly, we'll get organization data through users
        // First, get admins for the organization
        return getAdminsByOrganization(organizationId)
                .next() // Get the first admin user
                .flatMap(adminUser -> {
                    if (adminUser != null && adminUser.getOrganization() != null) {
                        System.out.println("Successfully fetched organization from user: " + adminUser.getOrganization().getOrganizationName());
                        return Mono.just(adminUser.getOrganization());
                    } else {
                        System.out.println("No organization data found in user for organization ID: " + organizationId);
                        return Mono.empty();
                    }
                })
                .onErrorResume(e -> {
                    System.err.println("Error fetching organization through users for organization " + organizationId + ": " + e.getMessage());
                    return Mono.empty();
                });
    }
}