package pe.edu.vallegrande.ms_water_quality.performance

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class AdminQualityLoadSimulation extends Simulation {

  // 🔹 Configuración del protocolo HTTP (ajusta la URL de tu microservicio)
  val httpProtocol = http
    .baseUrl("https://verbose-space-rotary-phone-g9gpxr5qqjwcvvjj-8080.app.github.dev") 
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  // 🔹 Escenario 1: Endpoint /sampling-points
  val samplingPoints = scenario("Carga sobre /api/admin/quality/sampling-points")
    .exec(
      http("GET /sampling-points")
        .get("/api/admin/quality/sampling-points")
        .check(status.is(200))
    )

  // 🔹 Escenario 2: Endpoint /tests
  val tests = scenario("Carga sobre /api/admin/quality/tests")
    .exec(
      http("GET /tests")
        .get("/api/admin/quality/tests")
        .check(status.in(200, 204))
    )

  // 🔹 Escenario 3: Endpoint /daily-records
  val dailyRecords = scenario("Carga sobre /api/admin/quality/daily-records")
    .exec(
      http("GET /daily-records")
        .get("/api/admin/quality/daily-records")
        .check(status.in(200, 204))
    )

  // 🔹 Configuración de usuarios concurrentes y duración
  setUp(
    samplingPoints.inject(rampUsers(200).during(30.seconds)), // 0 → 200 usuarios en 30s
    tests.inject(rampUsers(150).during(25.seconds)),          // 0 → 150 usuarios en 25s
    dailyRecords.inject(rampUsers(100).during(20.seconds))    // 0 → 100 usuarios en 20s
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.max.lt(2000),       // Tiempo máximo de respuesta < 2s
      global.successfulRequests.percent.gt(95) // Al menos 95% de requests exitosas
    )
}
