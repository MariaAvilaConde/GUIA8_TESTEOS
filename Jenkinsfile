pipeline {
    agent any

    environment {
        // 🔐 Token configurado en Jenkins (Manage Jenkins → Credentials → Secret Text)
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        // 🔑 Configuración de tu organización y proyecto en SonarCloud
        SONAR_PROJECT_KEY = 'MariaAvilaConde_GUIA8_TESTEOS'
        SONAR_ORG = 'MariaAvila25'
        SONAR_HOST_URL = 'https://sonarcloud.io'
    }

    tools {
        jdk 'jdk17'          // Asegúrate de tener configurado en Jenkins un JDK con este nombre
        maven 'Maven3'       // Igual para Maven (Manage Jenkins → Global Tool Configuration)
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Descargando el código fuente...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo '🔧 Compilando el proyecto con Maven...'
                sh 'mvn clean compile'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Ejecutando pruebas unitarias...'
                sh 'mvn test'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Code Analysis - SonarCloud') {
            steps {
                echo '🚀 Ejecutando análisis de código en SonarCloud...'
                sh '''
                    mvn verify sonar:sonar \
                      -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                      -Dsonar.organization=${SONAR_ORG} \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_TOKEN}
                '''
            }
        }

        stage('Package') {
            steps {
                echo '📦 Empaquetando la aplicación...'
                sh 'mvn package -DskipTests'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline ejecutado exitosamente. Proyecto analizado en SonarCloud.'
            echo "🔗 Revisa el reporte en: https://sonarcloud.io/project/overview?id=${SONAR_PROJECT_KEY}"
        }
        failure {
            echo '❌ Falló la ejecución del pipeline.'
        }
    }
}
