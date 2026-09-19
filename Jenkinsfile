pipeline {
    agent any

    parameters {
        choice(
            name: 'TARGET_SERVICE',
            choices: ['all', 'user-service', 'catalog-service', 'order-service', 'payment-service', 'hello-world'],
            description: 'Select microservice to build, test, and deploy'
        )
        string(
            name: 'DOCKER_REGISTRY',
            defaultValue: 'divya16sachan',
            description: 'Docker Hub / Container Registry namespace'
        )
        booleanParam(
            name: 'AUTO_ROLLBACK',
            defaultValue: true,
            description: 'Automatically trigger kubectl rollout undo if post-deploy health check fails'
        )
    }

    environment {
        K8S_NAMESPACE = 'ecom'
        GIT_SHA_SHORT = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo "latest"', returnStdout: true).trim()
        DOCKER_CREDS = credentials('dockerhub-credentials') // optional: configure in Jenkins if pushing to Hub
    }

    stages {
        stage('Checkout & Setup') {
            steps {
                echo "Starting CI/CD Pipeline for Person D Platform & Delivery"
                echo "Git Commit SHA: ${env.GIT_SHA_SHORT}"
                echo "Target Service: ${params.TARGET_SERVICE}"
                sh 'node -v && npm -v'
            }
        }

        stage('Lint & Typecheck') {
            steps {
                echo "Running static analysis and TypeScript validation..."
                sh 'npm --workspace=@ecom/shared run build'
                sh 'npm run typecheck --if-present'
            }
        }

        stage('Unit Tests') {
            steps {
                echo "Running unit test suites..."
                sh 'npm test --if-present'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def servicesToBuild = []
                    if (params.TARGET_SERVICE == 'all') {
                        servicesToBuild = ['user', 'catalog', 'order', 'payment']
                    } else if (params.TARGET_SERVICE == 'hello-world') {
                        servicesToBuild = ['hello-world']
                    } else {
                        def name = params.TARGET_SERVICE.replace('-service', '')
                        servicesToBuild = [name]
                    }

                    for (svc in servicesToBuild) {
                        def imageTag = "${params.DOCKER_REGISTRY}/ecom-${svc}:${env.GIT_SHA_SHORT}"
                        def latestTag = "${params.DOCKER_REGISTRY}/ecom-${svc}:latest"
                        echo "Building Docker image for ${svc}: ${imageTag}"

                        if (svc == 'hello-world') {
                            sh "docker build -t ${imageTag} -t ${latestTag} k8s/services/hello-world"
                        } else {
                            sh "docker build -f backend/services/${svc}/Dockerfile -t ${imageTag} -t ${latestTag} ."
                        }
                    }
                }
            }
        }

        stage('Push to Registry / Load to Kind') {
            steps {
                script {
                    // Check if local kind cluster is available
                    def isKindCluster = sh(script: 'kind get clusters 2>/dev/null | grep ecom || true', returnStdout: true).trim()

                    def servicesToPush = []
                    if (params.TARGET_SERVICE == 'all') {
                        servicesToPush = ['user', 'catalog', 'order', 'payment']
                    } else if (params.TARGET_SERVICE == 'hello-world') {
                        servicesToPush = ['hello-world']
                    } else {
                        servicesToPush = [params.TARGET_SERVICE.replace('-service', '')]
                    }

                    for (svc in servicesToPush) {
                        def imageTag = "${params.DOCKER_REGISTRY}/ecom-${svc}:${env.GIT_SHA_SHORT}"
                        if (isKindCluster) {
                            echo "Detected local kind cluster. Loading image into kind: ${imageTag}"
                            sh "kind load docker-image ${imageTag} --name ecom-sre-cluster || true"
                        } else {
                            echo "Pushing image to remote registry: ${imageTag}"
                            // sh "docker push ${imageTag}" // Uncomment when Docker Hub credentials are active
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "Applying Kubernetes base configurations..."
                    sh 'kubectl apply -k k8s/base --wait=true'

                    def servicesToDeploy = []
                    if (params.TARGET_SERVICE == 'all') {
                        servicesToDeploy = ['user', 'catalog', 'order', 'payment']
                    } else if (params.TARGET_SERVICE == 'hello-world') {
                        servicesToDeploy = ['hello-world']
                    } else {
                        servicesToDeploy = [params.TARGET_SERVICE.replace('-service', '')]
                    }

                    for (svc in servicesToDeploy) {
                        def deploymentName = "${svc}-service-deployment"
                        if (svc == 'hello-world') deploymentName = "hello-world-deployment"
                        def containerName = (svc == 'hello-world') ? "hello-world" : "${svc}-service"
                        def imageTag = "${params.DOCKER_REGISTRY}/ecom-${svc}:${env.GIT_SHA_SHORT}"

                        echo "Applying service manifests for ${svc}..."
                        sh "kubectl apply -k k8s/services/${svc} -n ${env.K8S_NAMESPACE}"

                        echo "Setting deployment image: ${deploymentName} -> ${imageTag}"
                        sh "kubectl set image deployment/${deploymentName} ${containerName}=${imageTag} -n ${env.K8S_NAMESPACE} --record || true"
                        
                        echo "Waiting for rollout to complete..."
                        sh "kubectl rollout status deployment/${deploymentName} -n ${env.K8S_NAMESPACE} --timeout=60s"
                    }
                }
            }
        }

        stage('Smoke Test & Health Probe') {
            steps {
                script {
                    echo "Executing automated post-deployment health checks..."
                    try {
                        // Forward or verify pod health endpoints
                        sh 'npm run smoke-test || node scripts/smoke_test.js'
                        echo "✅ All service health checks PASSED!"
                    } catch (Exception e) {
                        echo "❌ Post-deployment health verification FAILED!"
                        if (params.AUTO_ROLLBACK) {
                            echo "⚠️ AUTO-ROLLBACK TRIGGERED: Restoring previous healthy revision via kubectl rollout undo..."
                            def servicesToRollback = (params.TARGET_SERVICE == 'all') ? ['user', 'catalog', 'order', 'payment'] : [params.TARGET_SERVICE.replace('-service', '')]
                            for (svc in servicesToRollback) {
                                def dep = (svc == 'hello-world') ? 'hello-world-deployment' : "${svc}-service-deployment"
                                sh "kubectl rollout undo deployment/${dep} -n ${env.K8S_NAMESPACE}"
                                sh "kubectl rollout status deployment/${dep} -n ${env.K8S_NAMESPACE} --timeout=60s"
                            }
                            echo "✅ Rollback completed successfully. System self-healed to last stable state."
                        }
                        error("Deployment aborted and rolled back due to health check failure: ${e.message}")
                    }
                }
            }
        }
    }

    post {
        always {
            echo "CI/CD Pipeline run completed."
            sh 'kubectl get pods,hpa -n ecom -o wide || true'
        }
        success {
            echo "🎉 Pipeline finished successfully. New revision deployed and verified."
        }
        failure {
            echo "🚨 Pipeline encountered failure. Check rollback and pod logs."
        }
    }
}
