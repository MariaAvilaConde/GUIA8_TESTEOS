package pe.edu.vallegrande.ms_water_quality.performance

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class AdminQualityLoadSimulation extends Simulation {

  // 🔹 Configuración del protocolo HTTP (ajusta el puerto si es diferente)
  val httpProtocol = http
    .baseUrl("http://localhost:8085") // Tu microservicio en ejecución
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  // 🔹 Escenario principal: Endpoint de prueba
  val samplingPoints = scenario("Carga sobre /api/admin/quality/sampling-points")
    .exec(
      http("GET /sampling-points")
        .get("/api/admin/quality/sampling-points")
        .check(status.is(200))
    )

  // 🔹 Segundo escenario: Endpoint de pruebas
  val tests = scenario("Carga sobre /api/admin/quality/tests")
    .exec(
      http("GET /tests")
        .get("/api/admin/quality/tests")
        .check(status.in(200, 204))
    )

  // 🔹 Tercer escenario: Endpoint de registros diarios
  val dailyRecords = scenario("Carga sobre /api/admin/quality/daily-records")
    .exec(
      http("GET /daily-records")
        .get("/api/admin/quality/daily-records")
        .check(status.in(200, 204))
    )

  // 🔹 Configuración de usuarios concurrentes y duración
  setUp(
    samplingPoints.inject(rampUsers(200).during(30.seconds)), // 200 usuarios en 30s
    tests.inject(rampUsers(150).during(25.seconds)),          // 150 usuarios en 25s
    dailyRecords.inject(rampUsers(100).during(20.seconds))    // 100 usuarios en 20s
  ).protocols(httpProtocol)
}