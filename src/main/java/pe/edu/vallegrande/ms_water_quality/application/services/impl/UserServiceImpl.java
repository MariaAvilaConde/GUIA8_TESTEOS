package pe.edu.vallegrande.ms_water_quality.application.services.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import pe.edu.vallegrande.ms_water_quality.application.services.UserService;
import pe.edu.vallegrande.ms_water_quality.domain.enums.Constants;
import pe.edu.vallegrande.ms_water_quality.domain.models.User;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.UserCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.UserResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.exception.CustomException;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public Flux<User> getAll() {
        return userRepository.findAll();
    }

    @Override
    public Flux<User> getAllActive() {
        return userRepository.findAllByStatus(Constants.ACTIVE.name());
    }

    @Override
    public Flux<User> getAllInactive() {
        return userRepository.findAllByStatus(Constants.INACTIVE.name());
    }

    @Override
    public Mono<User> getById(String id) {
        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "User not found",
                        "The requested user with id " + id + " was not found")));
    }

    @Override
    public Mono<UserResponse> save(UserCreateRequest request) {
        return userRepository.existsByEmail(request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new CustomException(
                                HttpStatus.BAD_REQUEST.value(),
                                "Email already exists",
                                "The email " + request.getEmail() + " is already registered"));
                    }

                    User user = new User();
                    user.setName(request.getName());
                    user.setEmail(request.getEmail());
                    user.setPassword(request.getPassword());
                    user.setCreatedAt(LocalDateTime.now());
                    user.setStatus(Constants.ACTIVE.name());

                    return userRepository.save(user)
                            .map(savedUser -> {
                                UserResponse response = new UserResponse();
                                response.setUserId(savedUser.getUserId());
                                response.setName(savedUser.getName());
                                response.setEmail(savedUser.getEmail());
                                response.setStatus(savedUser.getStatus());
                                response.setCreatedAt(savedUser.getCreatedAt());
                                response.setUpdatedAt(savedUser.getUpdatedAt());
                                return response;
                            });
                });
    }

    @Override
    public Mono<User> update(String id, User user) {
        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "User not found",
                        "Cannot update non-existent user with id " + id)))
                .flatMap(existingUser -> {
                    existingUser.setName(user.getName());
                    existingUser.setEmail(user.getEmail());
                    existingUser.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(existingUser);
                });
    }

    @Override
    public Mono<Void> delete(String id) {
        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "User not found",
                        "Cannot delete non-existent user with id " + id)))
                .flatMap(userRepository::delete);
    }

    @Override
    public Mono<User> activate(String id) {
        return changeStatus(id, Constants.ACTIVE.name());
    }

    @Override
    public Mono<User> deactivate(String id) {
        return changeStatus(id, Constants.INACTIVE.name());
    }

    private Mono<User> changeStatus(String id, String status) {
        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "User not found",
                        "Cannot change status of non-existent user with id " + id)))
                .flatMap(user -> {
                    user.setStatus(status);
                    user.setUpdatedAt(LocalDateTime.now());
                    return userRepository.save(user);
                });
    }
}