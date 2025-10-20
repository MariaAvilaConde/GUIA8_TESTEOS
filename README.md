# Microservicio de Calidad del Agua (ms-water-quality) - API Endpoints

Este documento describe los endpoints disponibles en el microservicio de Calidad del Agua, incluyendo ejemplos de cómo interactuar con ellos para insertar y editar entidades.

La ruta base para todos los endpoints es `/api/admin/quality`.

---

## 1. Testing Points (Puntos de Muestreo)

**Ruta Base:** `/api/admin/quality/sampling-points`

### Endpoints

*   **`GET /api/admin/quality/sampling-points`**: Obtener todos los puntos de muestreo (enriquecidos).
*   **`GET /api/admin/quality/sampling-points/active`**: Obtener todos los puntos de muestreo activos (enriquecidos).
*   **`GET /api/admin/quality/sampling-points/inactive`**: Obtener todos los puntos de muestreo inactivos (enriquecidos).
*   **`GET /api/admin/quality/sampling-points/{id}`**: Obtener un punto de muestreo por ID (enriquecido).
*   **`POST /api/admin/quality/sampling-points`**: Crear un nuevo punto de muestreo.
*   **`PUT /api/admin/quality/sampling-points/{id}`**: Actualizar un punto de muestreo existente.
*   **`DELETE /api/admin/quality/sampling-points/{id}`**: Eliminar lógicamente un punto de muestreo.
*   **`PATCH /api/admin/quality/sampling-points/activate/{id}`**: Activar un punto de muestreo.
*   **`PATCH /api/admin/quality/sampling-points/deactivate/{id}`**: Desactivar un punto de muestreo.

### Ejemplos JSON

#### **POST /api/admin/quality/sampling-points (Insertar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "pointCode": "PT001",
  "pointName": "Punto de Muestreo Principal",
  "pointType": "RESERVORIO",
  "zoneId": "ZN0001",
  "locationDescription": "Cerca del tanque principal",
  "street": "Calle Falsa 123",
  "coordinates": {
    "latitude": -12.046374,
    "longitude": -77.042793
  }
}
```

#### **PUT /api/admin/quality/sampling-points/{id} (Editar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "pointCode": "PT001",
  "pointName": "Punto de Muestreo Principal Actualizado",
  "pointType": "RED_DISTRIBUCION",
  "zoneId": "ZN0002",
  "locationDescription": "Cerca de la estación de bombeo",
  "street": "Avenida Siempre Viva 742",
  "coordinates": {
    "latitude": -12.046374,
    "longitude": -77.042793
  },
  "status": "ACTIVE"
}
```

---

## 2. Quality Parameters (Parámetros de Calidad)

**Ruta Base:** `/api/admin/quality/parameters`

### Endpoints

*   **`GET /api/admin/quality/parameters`**: Obtener todos los parámetros de calidad (enriquecidos).
*   **`GET /api/admin/quality/parameters/active`**: Obtener todos los parámetros de calidad activos (enriquecidos).
*   **`GET /api/admin/quality/parameters/inactive`**: Obtener todos los parámetros de calidad inactivos (enriquecidos).
*   **`GET /api/admin/quality/parameters/{id}`**: Obtener un parámetro de calidad por ID (enriquecido).
*   **`POST /api/admin/quality/parameters`**: Crear un nuevo parámetro de calidad.
*   **`PUT /api/admin/quality/parameters/{id}`**: Actualizar un parámetro de calidad existente.
*   **`DELETE /api/admin/quality/parameters/{id}`**: Eliminar un parámetro de calidad.
*   **`PATCH /api/admin/quality/parameters/activate/{id}`**: Activar un parámetro de calidad.
*   **`PATCH /api/admin/quality/parameters/deactivate/{id}`**: Desactivar un parámetro de calidad.

### Ejemplos JSON

#### **POST /api/admin/quality/parameters (Insertar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "parameterCode": "PH001",
  "parameterName": "pH del Agua",
  "unitOfMeasure": "pH",
  "minAcceptable": 6.5,
  "maxAcceptable": 8.5,
  "optimalRange": {
    "min": 7.0,
    "max": 7.8
  },
  "testFrequency": "DAILY"
}
```

#### **PUT /api/admin/quality/parameters/{id} (Editar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "parameterCode": "PH001",
  "parameterName": "pH del Agua Potable",
  "unitOfMeasure": "pH",
  "minAcceptable": 6.8,
  "maxAcceptable": 8.2,
  "optimalRange": {
    "min": 7.2,
    "max": 7.6
  },
  "testFrequency": "WEEKLY",
  "status": "ACTIVE"
}
```

---

## 3. Quality Tests (Pruebas de Calidad)

**Ruta Base:** `/api/admin/quality/tests`

### Endpoints

*   **`GET /api/admin/quality/tests`**: Obtener todas las pruebas de calidad.
*   **`GET /api/admin/quality/tests/{id}`**: Obtener una prueba de calidad por ID (enriquecida).
*   **`POST /api/admin/quality/tests`**: Crear una nueva prueba de calidad.
*   **`PUT /api/admin/quality/tests/{id}`**: Actualizar una prueba de calidad existente.
*   **`DELETE /api/admin/quality/tests/{id}`**: Eliminar lógicamente una prueba de calidad.
*   **`DELETE /api/admin/quality/tests/physical/{id}`**: Eliminar físicamente una prueba de calidad.
*   **`PATCH /api/admin/quality/tests/restore/{id}`**: Restaurar una prueba de calidad eliminada lógicamente.

### Ejemplos JSON

#### **POST /api/admin/quality/tests (Insertar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "testCode": "ANL001",
  "testingPointId": "68c08b7163293e2fe5fcdb1a",
  "testDate": "2025-10-06T10:00:00",
  "testType": "FISICOQUIMICO",
  "testedByUserId": "68c08b7163293e2fe5fcdb1a",
  "weatherConditions": "Soleado",
  "waterTemperature": 25.5,
  "generalObservations": "Agua clara, sin olor",
  "status": "COMPLETED",
  "results": [
    {
      "parameterId": "PH001",
      "parameterCode": "PH001",
      "measuredValue": 7.5,
      "unit": "pH",
      "status": "ACCEPTABLE",
      "observations": "Dentro del rango óptimo"
    },
    {
      "parameterId": "TURB001",
      "parameterCode": "TURB001",
      "measuredValue": 0.8,
      "unit": "NTU",
      "status": "ACCEPTABLE",
      "observations": "Baja turbidez"
    }
  ]
}
```

#### **PUT /api/admin/quality/tests/{id} (Editar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "testCode": "ANL001",
  "testingPointId": "68c08b7163293e2fe5fcdb1a",
  "testDate": "2025-10-06T11:30:00",
  "testType": "BACTERIOLOGICO",
  "testedByUserId": "68c0a4ab07fa2d47448b530a",
  "weatherConditions": "Nublado",
  "waterTemperature": 24.0,
  "generalObservations": "Agua ligeramente turbia",
  "status": "PENDING",
  "results": [
    {
      "parameterId": "PH001",
      "parameterCode": "PH001",
      "measuredValue": 7.2,
      "unit": "pH",
      "status": "ACCEPTABLE",
      "observations": "Rango aceptable"
    }
  ]
}
```

---

## 4. Daily Records (Registros Diarios)

**Ruta Base:** `/api/admin/quality/daily-records`

### Endpoints

*   **`GET /api/admin/quality/daily-records`**: Obtener todos los registros diarios (enriquecidos).
*   **`GET /api/admin/quality/daily-records/{id}`**: Obtener un registro diario por ID (enriquecido).
*   **`POST /api/admin/quality/daily-records`**: Crear un nuevo registro diario.
*   **`PUT /api/admin/quality/daily-records/{id}`**: Actualizar un registro diario existente.
*   **`DELETE /api/admin/quality/daily-records/{id}`**: Eliminar lógicamente un registro diario.
*   **`DELETE /api/admin/quality/daily-records/physical/{id}`**: Eliminar físicamente un registro diario.
*   **`PATCH /api/admin/quality/daily-records/restore/{id}`**: Restaurar un registro diario eliminado lógicamente.

### Ejemplos JSON

#### **POST /api/admin/quality/daily-records (Insertar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "recordCode": "DR001",
  "testingPointIds": ["68c08b7163293e2fe5fcdb1a"],
  "recordDate": "2025-10-06T08:00:00",
  "level": 1.5,
  "acceptable": true,
  "actionRequired": false,
  "recordedByUserId": "68c08b7163293e2fe5fcdb1a",
  "observations": "Nivel de cloro dentro de los límites",
  "amount": 0.5,
  "recordType": "CLORO"
}
```

#### **PUT /api/admin/quality/daily-records/{id} (Editar)**

```json
{
  "organizationId": "6896b2ecf3e398570ffd99d3",
  "recordCode": "DR001",
  "testingPointIds": ["68c08b7163293e2fe5fcdb1a"],
  "recordDate": "2025-10-06T09:30:00",
  "level": 1.8,
  "acceptable": false,
  "actionRequired": true,
  "recordedByUserId": "68c0a4ab07fa2d47448b530a",
  "observations": "Nivel de cloro bajo, requiere acción inmediata",
  "amount": 0.7,
  "recordType": "CLORO"
}
```