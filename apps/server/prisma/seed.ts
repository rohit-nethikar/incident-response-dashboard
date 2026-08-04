import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { SOURCE_SYSTEMS } from "@incident-dash/shared";

const prisma = new PrismaClient();

async function main() {
  const teams = await Promise.all(
    ["Platform Engineering", "Data Engineering", "BI / Tableau Admins"].map((name) =>
      prisma.team.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} on-call rotation` },
      })
    )
  );

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
  let adminUser = null;
  if (seedAdminEmail) {
    adminUser = await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: {},
      create: {
        // Placeholder googleSub until the real Google sign-in happens and
        // NextAuth's user-sync overwrites it with the real "sub" claim,
        // matched by email.
        googleSub: `seed:${seedAdminEmail}`,
        email: seedAdminEmail,
        role: "ADMIN",
      },
    });

    await prisma.auditLogEntry.create({
      data: {
        action: "SEED_ADMIN_PROMOTED",
        actorId: adminUser.id,
        metadata: { reason: "SEED_ADMIN_EMAIL matched at seed time", email: seedAdminEmail },
      },
    });
  }

  for (const sourceSystem of SOURCE_SYSTEMS) {
    await prisma.connectorState.upsert({
      where: { sourceSystem },
      update: {},
      create: { sourceSystem, mode: "mock", isHealthy: true },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "mockGenerator" },
    update: {},
    create: {
      key: "mockGenerator",
      value: { enabled: true, intervalMs: 8000 },
    },
  });

  const runbookSeeds: Array<{
    title: string;
    sourceSystem: (typeof SOURCE_SYSTEMS)[number];
    triggerTags: string[];
    steps: { title: string; description: string }[];
    ownerTeamId: string;
  }> = [
    {
      title: "Cloud Run crash-loop triage",
      sourceSystem: "CLOUD_RUN",
      triggerTags: ["crash-loop", "oom"],
      steps: [
        { title: "Check recent revisions", description: "Compare the failing revision against the last healthy one for config/image diffs." },
        { title: "Inspect container logs", description: "Look for OOMKilled or unhandled exceptions immediately before the restart." },
        { title: "Roll back if needed", description: "Redirect traffic to the last known-good revision while root-causing." },
      ],
      ownerTeamId: teams[0].id,
    },
    {
      title: "BigQuery slot contention response",
      sourceSystem: "BIGQUERY",
      triggerTags: ["slot-contention", "job-timeout"],
      steps: [
        { title: "Identify heavy queries", description: "Check INFORMATION_SCHEMA.JOBS_BY_PROJECT for top slot consumers in the window." },
        { title: "Check reservation assignment", description: "Confirm the affected project has adequate reserved slots or is on-demand." },
        { title: "Coordinate with query owner", description: "Ask the owning team to optimize or reschedule the offending job." },
      ],
      ownerTeamId: teams[1].id,
    },
    {
      title: "Data Fusion pipeline failure recovery",
      sourceSystem: "DATA_FUSION",
      triggerTags: ["pipeline-failed", "plugin-error"],
      steps: [
        { title: "Open pipeline run logs", description: "Identify the failing stage/plugin from the run detail page." },
        { title: "Check upstream data availability", description: "Confirm source data landed and schema hasn't drifted." },
        { title: "Rerun from checkpoint", description: "Restart the pipeline from the last successful checkpoint once root cause is fixed." },
      ],
      ownerTeamId: teams[1].id,
    },
    {
      title: "Tableau extract refresh failure",
      sourceSystem: "TABLEAU_SERVER",
      triggerTags: ["extract-refresh-failed", "queue-backed-up"],
      steps: [
        { title: "Check background job status", description: "Inspect the failed job's error detail on the Tableau Server admin views." },
        { title: "Verify data source connectivity", description: "Confirm credentials and network path to the underlying data source are healthy." },
        { title: "Re-run the extract manually", description: "Trigger a manual refresh once the underlying issue is resolved; notify workbook owner." },
      ],
      ownerTeamId: teams[2].id,
    },
    {
      title: "Cloud Functions error-rate spike",
      sourceSystem: "CLOUD_FUNCTIONS",
      triggerTags: ["error-rate-spike", "cold-start"],
      steps: [
        { title: "Check recent deploys", description: "Correlate the spike start time with the most recent function deployment." },
        { title: "Inspect structured logs", description: "Filter Cloud Logging for the function name and severity>=ERROR." },
        { title: "Roll back or patch", description: "Roll back to the previous version if the spike started at deploy time." },
      ],
      ownerTeamId: teams[0].id,
    },
    {
      title: "Cloud Monitoring alert policy fired",
      sourceSystem: "CLOUD_MONITORING",
      triggerTags: ["uptime-check-failed", "alert-fired"],
      steps: [
        { title: "Confirm scope of impact", description: "Check whether the failure is isolated to one region/instance or widespread." },
        { title: "Check dependent services", description: "Verify downstream dependencies aren't the true root cause." },
        { title: "Escalate per on-call policy", description: "Page the owning team if impact exceeds the alert's stated threshold." },
      ],
      ownerTeamId: teams[0].id,
    },
    {
      title: "Cloud Logging error-spike investigation",
      sourceSystem: "CLOUD_LOGGING",
      triggerTags: ["log-error-spike"],
      steps: [
        { title: "Isolate the log pattern", description: "Use the matched query to find the exact recurring error signature." },
        { title: "Trace to originating service", description: "Identify which resource/service is emitting the pattern." },
        { title: "File or link a bug", description: "If this is a new pattern, file a tracking issue and link it in the incident notes." },
      ],
      ownerTeamId: teams[0].id,
    },
  ];

  for (const rb of runbookSeeds) {
    const existing = await prisma.runbook.findFirst({ where: { title: rb.title } });
    if (!existing && adminUser) {
      await prisma.runbook.create({
        data: {
          title: rb.title,
          sourceSystem: rb.sourceSystem,
          triggerTags: rb.triggerTags,
          steps: rb.steps,
          ownerTeamId: rb.ownerTeamId,
          createdById: adminUser.id,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
