# Trigger.dev code execution workers

The `run-code` and `submit-code` tasks use Trigger.dev as the trusted
supervisor and create one short-lived Kubernetes pod per task. The selected
language image receives the composed source file; testcase input is sent to the
process over `stdin` one testcase at a time. Expected outputs and the remaining
hidden inputs stay in the Trigger task and are never mounted into the pod.

## Trigger.dev secrets

Configure these values in the Trigger.dev environment:

- `DATABASE_URL`: PostgreSQL connection string used by the Prisma client.
- `KUBERNETES_API_URL`: HTTPS URL for the Kubernetes API server.
- `KUBERNETES_TOKEN`: a namespace-scoped service-account bearer token.
- `KUBERNETES_CA_DATA`: base64-encoded PEM CA certificate for the API server.
- `KUBERNETES_NAMESPACE`: dedicated namespace for disposable executor pods.
- `KUBERNETES_NETWORK_POLICY_NAME`: name of the deny-all policy described below.
- `KUBERNETES_IMAGE_PULL_SECRET` (optional): image pull secret in that namespace.

Configure `TRIGGER_SECRET_KEY` in the Next.js server environment as well; the
question attempt APIs use it to enqueue the `run-code` and `submit-code` tasks.
Keep this key server-only.

The service account needs only `get`, `create`, and `delete` on pods, `create`
on `pods/exec`, and `get` on the named NetworkPolicy. Do not mount its token in
the executor pods; the worker explicitly disables service-account token
automounting.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nekodojo-trigger-worker
  namespace: nekodojo-executors
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nekodojo-trigger-worker
  namespace: nekodojo-executors
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "create", "delete"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["networkpolicies"]
    resourceNames: ["nekodojo-executor-deny-all"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: nekodojo-trigger-worker
  namespace: nekodojo-executors
subjects:
  - kind: ServiceAccount
    name: nekodojo-trigger-worker
    namespace: nekodojo-executors
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: nekodojo-trigger-worker
```

Use a short-lived token where possible and establish a rotation process before
production deployment; never put Kubernetes credentials in the repository.

## Network isolation

Install a deny-all NetworkPolicy in the executor namespace. The worker checks
for this policy before creating a pod and fails closed if the policy is missing
or has ingress/egress rules.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nekodojo-executor-deny-all
  namespace: nekodojo-executors
spec:
  podSelector:
    matchLabels:
      app: nekodojo-executor
  policyTypes:
    - Ingress
    - Egress
  ingress: []
  egress: []
```

Use a Kubernetes network plugin that enforces NetworkPolicies. The worker
cannot verify enforcement by the cluster's CNI, so this is a deployment
requirement, not an optional hardening measure. Use a dedicated namespace with
no other workloads, secrets, or service-account permissions.
The Kubernetes API must negotiate `v5.channel.k8s.io` for pod exec so the
worker can close each testcase's stdin channel without closing the process
output stream. The worker fails closed if that protocol is unavailable.

## Language image contract

Each configured `Language.dockerImage` must provide `/bin/sh`, `cat`, and
`sleep`, and must run as UID/GID `10001` with a read-only root filesystem. The
pod provides writable `/workspace` and `/tmp` volumes, drops all Linux
capabilities, disables privilege escalation and service-account token
automount, and applies CPU, memory, ephemeral-storage, and execution-time
limits.

The worker replaces exactly one `//USER_CODE` placeholder in the question's
`driverCode` with the submitted editor contents, then writes the composed
program to `/workspace/Main.<extension>`. A missing or repeated placeholder is
rejected. `compileCmd`, when configured, runs once from `/workspace`;
`runCmd` runs once per testcase from the same directory and reads the current
input from standard input. These command strings are trusted administrator
configuration, not user input. They should refer to the generated source file
or compiled output without interpolating submission data into shell commands.

`Run` returns the execution output and does not write `UserProgress`.
`Submit` evaluates every testcase until the first failure and writes the final
verdict to `UserProgress`. `EXACT_MATCH` compares output text after normalizing
CRLF line endings; `UNORDERED_MATCH` compares sorted whitespace-delimited
tokens. Custom/special checkers currently return `SYSTEM_ERROR` rather than
being treated as accepted; a checker input/output contract is required before
they can be run safely.

Kubernetes resource limits enforce memory usage, but exact peak memory
measurement is not currently collected; `UserProgress.memoryUsed` remains
zero. Configure node-level pod PID limits and runtime/container safeguards as
part of cluster hardening.
