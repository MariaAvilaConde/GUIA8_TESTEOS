package pe.edu.vallegrande.ms_water_quality.infrastructure.repository;

import pe.edu.vallegrande.ms_water_quality.domain.models.User;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends ReactiveMongoRepository<User, String> {
    Mono<User> findByEmail(String email);
    Flux<User> findAllByStatus(String status);
    Mono<Boolean> existsByEmail(String email);
}