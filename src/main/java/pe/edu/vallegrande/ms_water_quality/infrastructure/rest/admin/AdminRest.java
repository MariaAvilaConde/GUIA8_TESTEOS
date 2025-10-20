package pe.edu.vallegrande.ms_water_quality.infrastructure.rest.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.ms_water_quality.application.services.DailyRecordService;
import pe.edu.vallegrande.ms_water_quality.application.services.QualityTestService;
import pe.edu.vallegrande.ms_water_quality.application.services.TestingPointService;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.ResponseDto;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.DailyRecordCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.QualityTestCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.TestingPointCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.TestingPointResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.DailyRecordEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.QualityTestEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.TestingPointEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.exception.CustomException;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/quality")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRest {

    private final TestingPointService testingPointService;
    private final QualityTestService qualityTestService;
    private final DailyRecordService dailyRecordService;

    // #region Testing Points

    @GetMapping("/sampling-points")
    public Mono<ResponseDto<List<TestingPointEnrichedResponse>>> getAllTestingPoints() {
        return testingPointService.getAll().collectList().map(list -> new ResponseDto<>(true, list, null));
    }

    @GetMapping("/sampling-points/active")
    public Mono<ResponseDto<List<TestingPointEnrichedResponse>>> getAllActiveTestingPoints() {
        return testingPointService.getAllActive().collectList().map(list -> new ResponseDto<>(true, list, null));
    }

    @GetMapping("/sampling-points/inactive")
    public Mono<ResponseDto<List<TestingPointEnrichedResponse>>> getAllInactiveTestingPoints() {
        return testingPointService.getAllInactive().collectList().map(list -> new ResponseDto<>(true, list, null));
    }

    @GetMapping("/sampling-points/{id}")
    public Mono<ResponseDto<TestingPointEnrichedResponse>> getTestingPointById(@PathVariable String id) {
        return testingPointService.getById(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)));
    }

    @PostMapping("/sampling-points")
    public Mono<ResponseEntity<ResponseDto<TestingPointResponse>>> saveTestingPoint(@RequestBody TestingPointCreateRequest request) {
        return testingPointService.save(request).map(data -> ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDto<>(true, data, null)));
    }

    @PutMapping("/sampling-points/{id}")
    public Mono<ResponseDto<TestingPoint>> updateTestingPoint(@PathVariable String id, @RequestBody TestingPoint point) {
        return testingPointService.update(id, point)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)));
    }

    @DeleteMapping("/sampling-points/{id}")
    public Mono<ResponseDto<Void>> deleteTestingPoint(@PathVariable String id) {
        return testingPointService.delete(id).then(Mono.just(new ResponseDto<>(true, null, null)));
    }

    @PatchMapping("/sampling-points/activate/{id}")
    public Mono<ResponseDto<TestingPointEnrichedResponse>> activateTestingPoint(@PathVariable String id) {
        return testingPointService.activate(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)));
    }

    @PatchMapping("/sampling-points/deactivate/{id}")
    public Mono<ResponseDto<TestingPointEnrichedResponse>> deactivateTestingPoint(@PathVariable String id) {
        return testingPointService.deactivate(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)));
    }

    // #endregion

    // #region Quality Tests

    @GetMapping("/tests")
    public Mono<ResponseDto<List<QualityTestEnrichedResponse>>> getAllTests() {
        return qualityTestService.getAll().collectList().map(list -> new ResponseDto<>(true, list, null));
    }

    @GetMapping("/tests/{id}")
    public Mono<ResponseDto<QualityTestEnrichedResponse>> getTestById(@PathVariable String id) {
        return qualityTestService.getById(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("QualityTest", id)));
    }

    @PostMapping("/tests")
    public Mono<ResponseEntity<ResponseDto<QualityTestEnrichedResponse>>> saveTest(@RequestBody QualityTestCreateRequest request) {
        return qualityTestService.save(request).map(data -> ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDto<>(true, data, null)));
    }

    @PutMapping("/tests/{id}")
    public Mono<ResponseDto<QualityTestEnrichedResponse>> updateTest(@PathVariable String id, @RequestBody QualityTestCreateRequest request) {
        return qualityTestService.update(id, request)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("QualityTest", id)));
    }

    @DeleteMapping("/tests/{id}")
    public Mono<ResponseDto<Void>> deleteTest(@PathVariable String id) {
        return qualityTestService.delete(id).then(Mono.just(new ResponseDto<>(true, null, null)));
    }
    
    @DeleteMapping("/tests/physical/{id}")
    public Mono<ResponseDto<Void>> deleteTestPhysically(@PathVariable String id) {
        return qualityTestService.deletePhysically(id).then(Mono.just(new ResponseDto<>(true, null, null)));
    }

    @PatchMapping("/tests/restore/{id}")
    public Mono<ResponseDto<QualityTestEnrichedResponse>> restoreTest(@PathVariable String id) {
        return qualityTestService.restore(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("QualityTest", id)));
    }

    // #endregion

    // #region Daily Records

    @GetMapping("/daily-records")
    public Mono<ResponseDto<List<DailyRecordEnrichedResponse>>> getAllDailyRecords() {
        return dailyRecordService.getAll().collectList().map(list -> new ResponseDto<>(true, list, null));
    }

    @GetMapping("/daily-records/{id}")
    public Mono<ResponseDto<DailyRecordEnrichedResponse>> getDailyRecordById(@PathVariable String id) {
        return dailyRecordService.getById(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)));
    }

    @PostMapping("/daily-records")
    public Mono<ResponseEntity<ResponseDto<DailyRecordEnrichedResponse>>> saveDailyRecord(@RequestBody DailyRecordCreateRequest request) {
        return dailyRecordService.save(request).map(data -> ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDto<>(true, data, null)));
    }

    @PutMapping("/daily-records/{id}")
    public Mono<ResponseDto<DailyRecordEnrichedResponse>> updateDailyRecord(@PathVariable String id, @RequestBody DailyRecordCreateRequest request) {
        return dailyRecordService.update(id, request)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)));
    }

    @DeleteMapping("/daily-records/{id}")
    public Mono<ResponseDto<Void>> deleteDailyRecord(@PathVariable String id) {
        return dailyRecordService.delete(id).then(Mono.just(new ResponseDto<>(true, null, null)));
    }

    @DeleteMapping("/daily-records/physical/{id}")
    public Mono<ResponseDto<Void>> deleteDailyRecordPhysically(@PathVariable String id) {
        return dailyRecordService.deletePhysically(id).then(Mono.just(new ResponseDto<>(true, null, null)));
    }

    @PatchMapping("/daily-records/restore/{id}")
    public Mono<ResponseDto<DailyRecordEnrichedResponse>> restoreDailyRecord(@PathVariable String id) {
        return dailyRecordService.restore(id)
                .map(data -> new ResponseDto<>(true, data, null))
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)));
    }

    // #endregion
}