#!/usr/bin/env bash
CLUSTER_NAME="ecom-sre-cluster"
echo "Deleting kind cluster ${CLUSTER_NAME}..."
kind delete cluster --name "${CLUSTER_NAME}"
echo "Cluster deleted."
