pipeline {
    agent any

    environment {
        // 🔐 Token configurado en Jenkins (Manage Jenkins → Credentials → Global credentials)
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        // ✅ Claves correctas para SonarCloud
        SONAR_PROJECT_KEY = 'MariaAvilaConde_GUIA8_TESTEOS'
        SONAR_ORG = 'MariaAvilaConde'
    }

    tools {
        jdk 'jdk17'
        maven 'Maven3'
    }

    stages {
        stage('Build') {
            steps {
                echo '🚀 Compilando proyecto...'
                sh 'mvn clean verify -DskipTests'
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    echo '🔍 Ejecutando análisis de SonarCloud...'
                    sh '''
                        mvn sonar:sonar \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.host.url=https://sonarcloud.io \
                            -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('Package') {
            steps {
                echo '📦 Empaquetando artefacto...'
                sh 'mvn package -DskipTests'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline finalizado correctamente.'
        }
        failure {
            echo '❌ Build fallido. Revisa los logs de SonarCloud o Maven.'
        }
    }
}
