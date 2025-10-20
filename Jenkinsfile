pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('SONAR_TOKEN')
        SONAR_PROJECT_KEY = 'MariaAvilaConde_GUIA8_TESTEOS'
        SONAR_ORG = 'MariaAvilaConde'
    }

    tools {
        jdk 'jdk17'
        maven 'Maven3'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Clonando el repositorio...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Compilando el proyecto con Maven...'
                sh 'mvn -B clean verify'
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                withSonarQubeEnv('SonarCloud') {
                    echo 'Ejecutando análisis en SonarCloud...'
                    sh """
                        mvn sonar:sonar \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.host.url=https://sonarcloud.io \
                            -Dsonar.token=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Package') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'Empaquetando el artefacto final...'
                sh 'mvn package -DskipTests'
            }
        }
    }

    post {
        success {
            echo '✔️ Pipeline ejecutado exitosamente.'
        }
        failure {
            echo '❌ Falló la ejecución del pipeline.'
        }
    }
}
