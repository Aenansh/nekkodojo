import {
  CoreV1Api,
  Exec,
  KubeConfig,
  NetworkingV1Api,
  type V1Pod,
  type V1Status,
} from "@kubernetes/client-node";
import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";

const RUNNER_LABEL = "app";
const RUNNER_LABEL_VALUE = "nekodojo-executor";
const MAX_OUTPUT_BYTES = 1024 * 1024;
const POD_START_TIMEOUT_MS = 90_000;
const MAX_TASK_TIMEOUT_MS = 3_300_000;

type SandboxConfig = {
  image: string;
  memoryLimitMiB: number;
  timeLimitMs: number;
  testcaseCount: number;
  extension: string;
  imagePullSecret?: string;
};

type ExecResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  outputLimitExceeded: boolean;
};

type SandboxSession = {
  core: CoreV1Api;
  exec: Exec;
  namespace: string;
  podName: string;
  containerName: string;
};

export class SandboxExecutionError extends Error {
  constructor(
    message: string,
    readonly reason: "TIME_LIMIT_EXCEEDED" | "OUTPUT_LIMIT_EXCEEDED" | "SYSTEM_ERROR"
  ) {
    super(message);
    this.name = "SandboxExecutionError";
  }
}

function getKubernetesConfig() {
  const server = process.env.KUBERNETES_API_URL;
  const token = process.env.KUBERNETES_TOKEN;
  const caData = process.env.KUBERNETES_CA_DATA;
  const namespace = process.env.KUBERNETES_NAMESPACE;
  const networkPolicyName = process.env.KUBERNETES_NETWORK_POLICY_NAME;

  if (!server || !token || !caData || !namespace || !networkPolicyName) {
    throw new Error(
      "KUBERNETES_API_URL, KUBERNETES_TOKEN, KUBERNETES_CA_DATA, KUBERNETES_NAMESPACE, and KUBERNETES_NETWORK_POLICY_NAME must be configured"
    );
  }
  if (new URL(server).protocol !== "https:") {
    throw new Error("KUBERNETES_API_URL must use HTTPS");
  }

  const config = new KubeConfig();
  config.loadFromOptions({
    clusters: [
      {
        name: "nekodojo",
        server,
        caData,
        skipTLSVerify: false,
      },
    ],
    users: [{ name: "nekodojo-worker", token }],
    contexts: [
      {
        name: "nekodojo",
        cluster: "nekodojo",
        user: "nekodojo-worker",
        namespace,
      },
    ],
    currentContext: "nekodojo",
  });

  return {
    config,
    namespace,
    networkPolicyName,
    imagePullSecret: process.env.KUBERNETES_IMAGE_PULL_SECRET,
  };
}

async function verifyNetworkPolicy(
  api: NetworkingV1Api,
  namespace: string,
  name: string
) {
  const policy = await api.readNamespacedNetworkPolicy({ namespace, name });
  const spec = policy.spec;
  const labels = spec?.podSelector?.matchLabels;
  const policyTypes = spec?.policyTypes ?? [];

  if (
    labels?.[RUNNER_LABEL] !== RUNNER_LABEL_VALUE ||
    !policyTypes.includes("Ingress") ||
    !policyTypes.includes("Egress") ||
    (spec?.ingress?.length ?? 0) > 0 ||
    (spec?.egress?.length ?? 0) > 0
  ) {
    throw new Error(
      `NetworkPolicy '${name}' must select ${RUNNER_LABEL}=${RUNNER_LABEL_VALUE}, declare Ingress and Egress policyTypes, and contain no ingress or egress rules`
    );
  }
}

function createPod(
  podName: string,
  config: SandboxConfig,
  imagePullSecret?: string
): V1Pod {
  const extension = config.extension.replace(/^\./, "");
  if (!/^[A-Za-z0-9]+$/.test(extension)) {
    throw new Error("Language extension must contain only letters and numbers");
  }

  const activeDeadlineSeconds = Math.ceil(
    (config.timeLimitMs * config.testcaseCount + 180_000) / 1000
  );
  if (activeDeadlineSeconds > MAX_TASK_TIMEOUT_MS / 1000) {
    throw new Error("Question testcase batch exceeds the maximum sandbox duration");
  }

  return {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: podName,
      labels: {
        [RUNNER_LABEL]: RUNNER_LABEL_VALUE,
      },
    },
    spec: {
      restartPolicy: "Never",
      activeDeadlineSeconds,
      automountServiceAccountToken: false,
      enableServiceLinks: false,
      securityContext: {
        runAsNonRoot: true,
        runAsUser: 10001,
        runAsGroup: 10001,
        fsGroup: 10001,
        seccompProfile: { type: "RuntimeDefault" },
      },
      ...(imagePullSecret
        ? { imagePullSecrets: [{ name: imagePullSecret }] }
        : {}),
      containers: [
        {
          name: "executor",
          image: config.image,
          imagePullPolicy: "IfNotPresent",
          command: ["/bin/sh", "-c", "sleep 86400"],
          workingDir: "/workspace",
          env: [
            { name: "WORKSPACE", value: "/workspace" },
            { name: "SOURCE_FILE", value: `/workspace/Main.${extension}` },
          ],
          securityContext: {
            allowPrivilegeEscalation: false,
            readOnlyRootFilesystem: true,
            capabilities: { drop: ["ALL"] },
          },
          resources: {
            requests: {
              cpu: "100m",
              memory: `${config.memoryLimitMiB}Mi`,
              "ephemeral-storage": "64Mi",
            },
            limits: {
              cpu: "1",
              memory: `${config.memoryLimitMiB}Mi`,
              "ephemeral-storage": "1Gi",
            },
          },
          volumeMounts: [
            { name: "workspace", mountPath: "/workspace" },
            { name: "tmp", mountPath: "/tmp" },
          ],
        },
      ],
      volumes: [
        { name: "workspace", emptyDir: { sizeLimit: "512Mi" } },
        { name: "tmp", emptyDir: { sizeLimit: "128Mi" } },
      ],
    },
  };
}

async function waitForPod(core: CoreV1Api, namespace: string, podName: string) {
  const expiresAt = Date.now() + POD_START_TIMEOUT_MS;
  while (Date.now() < expiresAt) {
    const pod = await core.readNamespacedPod({ namespace, name: podName });
    const phase = pod.status?.phase;
    if (phase === "Running") return;
    if (phase === "Failed") {
      const container = pod.status?.containerStatuses?.[0];
      const reason =
        container?.state?.waiting?.reason ??
        container?.state?.terminated?.reason ??
        pod.status?.reason ??
        "unknown";
      throw new Error(`Sandbox pod failed to start: ${reason}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for sandbox pod to start");
}

function getExitCode(status: V1Status | undefined): number {
  const exitCodeCause = status?.details?.causes?.find(
    (cause) => cause.reason === "ExitCode"
  );
  const code = Number(exitCodeCause?.message);
  if (Number.isSafeInteger(code) && code >= 0) return code;
  return status?.status === "Success" ? 0 : 1;
}

async function execute(
  session: SandboxSession,
  command: string[],
  stdinText: string,
  timeoutMs: number
): Promise<ExecResult> {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const stdin = new PassThrough();
  let stdoutText = "";
  let stderrText = "";
  let totalOutputBytes = 0;
  let outputLimitExceeded = false;
  let status: V1Status | undefined;
  let socket: Awaited<ReturnType<Exec["exec"]>> | undefined;
  const startedAt = Date.now();

  const collect = (target: "stdout" | "stderr", chunk: Buffer) => {
    totalOutputBytes += chunk.byteLength;
    if (totalOutputBytes > MAX_OUTPUT_BYTES) {
      outputLimitExceeded = true;
      socket?.close();
      return;
    }
    if (target === "stdout") stdoutText += chunk.toString("utf8");
    else stderrText += chunk.toString("utf8");
  };
  stdout.on("data", (chunk: Buffer) => collect("stdout", chunk));
  stderr.on("data", (chunk: Buffer) => collect("stderr", chunk));

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const commandFinished = new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };

    void session.exec
      .exec(
        session.namespace,
        session.podName,
        session.containerName,
        command,
        stdout,
        stderr,
        stdin,
        false,
        (result) => {
          status = result;
        }
      )
      .then((connection) => {
        socket = connection;
        connection.once("close", () => finish());
        connection.once("error", (error: unknown) =>
          finish(error instanceof Error ? error : new Error(String(error)))
        );
        if (connection.readyState === 3) finish();
        if (connection.protocol !== "v5.channel.k8s.io") {
          connection.close();
          finish(
            new SandboxExecutionError(
              "The Kubernetes API must support the v5 exec streaming protocol",
              "SYSTEM_ERROR"
            )
          );
          return;
        }
        stdin.end(stdinText);
      })
      .catch((error: unknown) =>
        finish(error instanceof Error ? error : new Error(String(error)))
      );

    timeout = setTimeout(() => {
      socket?.close();
      finish(
        new SandboxExecutionError(
          `Execution exceeded ${timeoutMs} ms`,
          "TIME_LIMIT_EXCEEDED"
        )
      );
    }, timeoutMs);
  });

  try {
    await commandFinished;
  } catch (error) {
    if (error instanceof SandboxExecutionError) throw error;
    throw new SandboxExecutionError(
      error instanceof Error ? error.message : "Kubernetes exec failed",
      "SYSTEM_ERROR"
    );
  }

  if (outputLimitExceeded) {
    throw new SandboxExecutionError(
      `Execution exceeded the ${MAX_OUTPUT_BYTES}-byte output limit`,
      "OUTPUT_LIMIT_EXCEEDED"
    );
  }

  return {
    exitCode: getExitCode(status),
    stdout: stdoutText,
    stderr: stderrText,
    durationMs: Date.now() - startedAt,
    outputLimitExceeded,
  };
}

export async function withSandbox<T>(
  config: SandboxConfig,
  run: (session: SandboxSession) => Promise<T>
): Promise<T> {
  if (
    !Number.isSafeInteger(config.memoryLimitMiB) ||
    config.memoryLimitMiB < 16 ||
    config.memoryLimitMiB > 4096
  ) {
    throw new Error("Question memoryLimit must be between 16 and 4096 MiB");
  }
  if (
    !Number.isSafeInteger(config.timeLimitMs) ||
    config.timeLimitMs < 1 ||
    config.timeLimitMs > MAX_TASK_TIMEOUT_MS
  ) {
    throw new Error(
      `Question timeLimit must be between 1 and ${MAX_TASK_TIMEOUT_MS} ms`
    );
  }

  const settings = getKubernetesConfig();
  const core = settings.config.makeApiClient(CoreV1Api);
  const networking = settings.config.makeApiClient(NetworkingV1Api);
  await verifyNetworkPolicy(
    networking,
    settings.namespace,
    settings.networkPolicyName
  );

  const podName = `nekodojo-${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  let podCreated = false;
  let taskError: unknown;
  try {
    await core.createNamespacedPod({
      namespace: settings.namespace,
      body: createPod(podName, config, settings.imagePullSecret),
    });
    podCreated = true;
    await waitForPod(core, settings.namespace, podName);

    return await run({
      core,
      exec: new Exec(settings.config),
      namespace: settings.namespace,
      podName,
      containerName: "executor",
    });
  } catch (error) {
    taskError = error;
    throw error;
  } finally {
    if (podCreated) {
      try {
        await core.deleteNamespacedPod({
          namespace: settings.namespace,
          name: podName,
          gracePeriodSeconds: 0,
          body: { apiVersion: "v1", kind: "DeleteOptions" },
        });
      } catch (cleanupError) {
        console.error("[KUBERNETES_SANDBOX_CLEANUP]", cleanupError);
        if (!taskError) throw cleanupError;
      }
    }
  }
}

export async function writeSource(
  session: SandboxSession,
  sourceFile: string,
  source: string
) {
  if (!/^\/workspace\/Main\.[A-Za-z0-9]+$/.test(sourceFile)) {
    throw new Error("Source file path is invalid");
  }
  const result = await execute(
    session,
    ["/bin/sh", "-c", `cat > ${sourceFile}`],
    source,
    10_000
  );
  if (result.exitCode !== 0) {
    throw new Error(`Failed to stage source code: ${result.stderr.slice(0, 4000)}`);
  }
}

export async function runCommand(
  session: SandboxSession,
  command: string,
  stdin: string,
  timeoutMs: number
) {
  return execute(session, ["/bin/sh", "-c", command], stdin, timeoutMs);
}
