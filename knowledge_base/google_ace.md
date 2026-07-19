# Knowledge Base: Google Cloud Associate Cloud Engineer (ACE)

This document contains official syllabus details for Google Cloud Associate Cloud Engineer (ACE), covering resource hierarchy, IAM, networking, VM instances, storage, GKE cluster management, and monitoring.

---

## 1. Google Cloud Resource Hierarchy
Google Cloud resources are organized hierarchically to enforce access controls and inheritance policies:
1. **Organization**: Represents the company node. Root folder.
2. **Folders**: Logical groupings of projects (e.g. Departments like "Engineering", "QA").
3. **Projects**: The base container for allocating services, APIs, billing, and resources.
4. **Resources**: Individual assets (Compute Engine instances, GCS buckets, Pub/Sub topics).

*Policy Inheritance*: Any IAM policy set at a higher level (e.g., Folder) is automatically inherited by child nodes (Projects and Resources) and cannot be overridden by restriction at the lower level, only appended.

---

## 2. Identity & Access Management (IAM)
IAM allows administrators to authorize WHO (members/identities) can take WHAT actions on WHICH resources.
- **Identities**: Google Accounts, Google Groups, Service Accounts, Workspace Domains.
- **Roles**: Collection of permissions (e.g., `compute.instances.start`).
  - *Primitive Roles*: Owner, Editor, Viewer (Wide scopes. Avoid in production).
  - *Predefined Roles*: Fine-grained access managed by Google (e.g., `roles/storage.objectViewer`).
  - *Custom Roles*: User-defined permissions. Cannot be set at Folder/Org level for some services.
- **Service Accounts**: Special accounts representing non-human identities (applications/VMs). Authenticated via key files or IAM token exchange.

---

## 3. Virtual Private Cloud (VPC) Networking
A VPC provides network connectivity for resources in a project.
- **Subnets**: Regional segments containing IP ranges. Subnets can expand their CIDR block range without downtime.
- **Firewall Rules**: Control ingress (inbound) and egress (outbound) traffic using tags, IP blocks, and service accounts. Default rules block all ingress and allow all egress.
- **Cloud NAT**: Allows VM instances without external public IP addresses to connect to the internet securely.
- **Load Balancing**:
  - *Global HTTP(S) Load Balancer*: Layer 7, reverse proxy routing based on URL path/headers.
  - *Network Load Balancer*: Regional, Layer 4, routes TCP/UDP traffic based on IP protocol.

---

## 4. Google Kubernetes Engine (GKE)
GKE is a managed environment for deploying, managing, and scaling containerized applications using Google infrastructure.
- **Cluster Modes**:
  - *Standard*: User manages node configurations, pooling, size, and scaling.
  - *Autopilot*: Google provisions and automatically configures nodes, networks, and storage based on Pod resource specifications.
- **GKE Core Concepts**:
  - *Pods*: Smallest deployable unit containing one or more containers.
  - *Deployments*: Declares the desired state of pods (replicated state, updates).
  - *Services*: Exposes pods as network services (ClusterIP, NodePort, LoadBalancer).
  - *Kubectl CLI*: Commands to interact with GKE (e.g. `kubectl get pods`, `kubectl apply -f deployment.yaml`).

---

## Official Resource References
- **Google Cloud Platform Documentation**: [GCP Networking & Storage Guide](https://cloud.google.com/docs)
- **GeeksForGeeks**: [Google Cloud Platform Overview](https://www.geeksforgeeks.org/google-cloud-platform-gcp/)
- **Kubernetes Official Docs**: [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
