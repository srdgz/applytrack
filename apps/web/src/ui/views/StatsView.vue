<script setup lang="ts">
import type { StatusTone } from "@applytrack/presentation";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@applytrack/core";
import { statusTone } from "@applytrack/presentation";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

import { useDashboardStats } from "../../composables/useDashboardStats";
import { useFormat } from "../../composables/useFormat";
import AppIcon from "../components/AppIcon.vue";

const { t } = useI18n();
const { stats, status, reload } = useDashboardStats();
const { ratio, shortCalendarDate } = useFormat();

const rateTile = (label: string, count: number, icon: "message" | "users", tone: StatusTone) => {
  const sent = stats.value?.sent ?? 0;
  return {
    label,
    icon,
    tone,
    value: sent ? ratio(count, sent) : "—",
    detail: sent ? t("stats.rateDetail", { count, total: sent }) : t("stats.notSentYet"),
  };
};

const tiles = computed(() => {
  const current = stats.value;
  if (!current) return [];
  return [
    {
      label: t("stats.active"),
      icon: "briefcase" as const,
      tone: "applied" as const,
      value: String(current.active),
      detail: t("stats.activeDetail", { closed: current.closed }),
    },
    rateTile(t("stats.responseRate"), current.responded, "message", "screening"),
    rateTile(t("stats.interviewRate"), current.interviewed, "users", "interviewing"),
    {
      label: t("stats.offers"),
      icon: "award" as const,
      tone: "offer" as const,
      value: String(current.offered),
      detail: current.sent
        ? `${ratio(current.offered, current.sent)} · ${t("stats.rateDetail", { count: current.offered, total: current.sent })}`
        : t("stats.notSentYet"),
    },
  ];
});

const weeklyMax = computed(() =>
  Math.max(1, ...(stats.value?.weekly.map(({ count }) => count) ?? [])),
);

const statusMax = computed(() =>
  Math.max(1, ...Object.values(stats.value?.byStatus ?? {}).map((count) => count)),
);

const statusGroups = computed(() => [
  { title: t("stats.activeGroup"), statuses: ACTIVE_STATUSES },
  { title: t("stats.closedGroup"), statuses: CLOSED_STATUSES },
]);

const percentOf = (value: number, max: number) => `${String((value / max) * 100)}%`;
</script>

<template>
  <div class="flex flex-col gap-6 p-4 lg:p-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ t("stats.title") }}</h1>

    <div v-if="status === 'loading' && !stats" aria-busy="true" class="flex flex-col gap-4">
      <span class="sr-only">{{ t("feedback.loading") }}</span>
      <div aria-hidden="true" class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="index in 4"
          :key="index"
          class="bg-surface-muted h-28 animate-pulse rounded-lg"
        />
      </div>
    </div>

    <div
      v-else-if="status === 'error'"
      class="border-border bg-surface mx-auto max-w-md rounded-lg border p-6 text-center"
      role="alert"
    >
      <p class="font-semibold">{{ t("feedback.errorTitle") }}</p>
      <button
        type="button"
        class="bg-accent text-accent-ink shadow-accent transition hover:brightness-110 mt-4 min-h-10 rounded-md px-4 text-sm font-medium"
        @click="reload"
      >
        {{ t("feedback.retry") }}
      </button>
    </div>

    <div
      v-else-if="stats && stats.total === 0"
      class="border-border mx-auto max-w-md rounded-lg border border-dashed p-8 text-center"
    >
      <h2 class="font-semibold">{{ t("stats.emptyTitle") }}</h2>
      <RouterLink
        :to="{ name: 'application-new' }"
        class="bg-accent text-accent-ink shadow-accent transition hover:brightness-110 mt-4 inline-flex min-h-10 items-center rounded-md px-4 text-sm font-medium"
      >
        {{ t("stats.emptyAction") }}
      </RouterLink>
    </div>

    <template v-else-if="stats">
      <section aria-labelledby="stats-summary">
        <h2 id="stats-summary" class="sr-only">{{ t("stats.summary") }}</h2>
        <dl class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="tile in tiles"
            :key="tile.label"
            :data-tone="tile.tone"
            class="border-border bg-surface flex flex-col gap-1 rounded-lg border p-4 shadow-sm"
          >
            <dt class="text-ink-muted flex items-center gap-2 text-sm">
              <span
                class="flex size-8 items-center justify-center rounded-md bg-(--tone-soft) text-(--tone)"
              >
                <AppIcon :name="tile.icon" class="size-4" />
              </span>
              {{ tile.label }}
            </dt>
            <dd class="mt-1 text-3xl font-bold tracking-tight tabular-nums">{{ tile.value }}</dd>
            <dd class="text-ink-muted text-sm">{{ tile.detail }}</dd>
          </div>
        </dl>
      </section>

      <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div class="flex min-w-0 flex-col gap-6">
          <section
            class="border-border bg-surface rounded-lg border p-4 shadow-sm"
            aria-labelledby="stats-weekly"
          >
            <h2 id="stats-weekly" class="mb-4 font-semibold">{{ t("stats.weekly") }}</h2>
            <ol class="flex h-48 items-stretch gap-1 sm:gap-2">
              <li
                v-for="week in stats.weekly"
                :key="week.weekStart"
                class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <span class="sr-only">
                  {{
                    t("stats.weekLabel", {
                      date: shortCalendarDate(week.weekStart),
                      count: week.count,
                    })
                  }}
                </span>
                <span aria-hidden="true" class="text-sm font-semibold">{{ week.count }}</span>
                <span aria-hidden="true" class="flex h-32 w-full items-end justify-center">
                  <span
                    class="bg-accent block w-full max-w-10 min-h-0.5 rounded-t-md"
                    :style="{ height: percentOf(week.count, weeklyMax) }"
                  />
                </span>
                <span aria-hidden="true" class="text-ink-muted text-xs whitespace-nowrap">
                  {{ shortCalendarDate(week.weekStart) }}
                </span>
              </li>
            </ol>
          </section>

          <section
            class="border-border bg-surface rounded-lg border p-4 shadow-sm"
            aria-labelledby="stats-status"
          >
            <h2 id="stats-status" class="mb-4 font-semibold">{{ t("stats.byStatus") }}</h2>
            <div class="flex flex-col gap-5">
              <div v-for="group in statusGroups" :key="group.title">
                <h3 class="text-ink-muted mb-2 text-sm font-medium">{{ group.title }}</h3>
                <dl class="flex flex-col gap-2">
                  <div
                    v-for="item in group.statuses"
                    :key="item"
                    :data-tone="statusTone(item)"
                    class="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm"
                  >
                    <dt class="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-(--tone)" />
                      <span class="truncate">{{ t(`status.${item}`) }}</span>
                    </dt>
                    <span aria-hidden="true" class="bg-surface-muted h-2.5 rounded-full">
                      <span
                        class="block h-full min-w-0.5 rounded-full bg-(--tone)"
                        :style="{ width: percentOf(stats.byStatus[item], statusMax) }"
                      />
                    </span>
                    <dd class="w-6 text-right font-semibold">{{ stats.byStatus[item] }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        </div>

        <div class="flex min-w-0 flex-col gap-6">
          <section
            class="border-border bg-surface rounded-lg border p-4 shadow-sm"
            aria-labelledby="stats-source"
          >
            <h2 id="stats-source" class="mb-4 font-semibold">{{ t("stats.bySource") }}</h2>
            <p v-if="!stats.bySource.length" class="text-ink-muted text-sm">
              {{ t("stats.notSentYet") }}
            </p>
            <div
              v-else
              class="overflow-x-auto"
              tabindex="0"
              role="region"
              :aria-label="t('stats.bySource')"
            >
              <table class="w-full text-left text-sm">
                <caption class="sr-only">
                  {{
                    t("stats.bySource")
                  }}
                </caption>
                <thead class="text-ink-muted">
                  <tr>
                    <th scope="col" class="py-1 pr-3 font-medium">{{ t("stats.source") }}</th>
                    <th scope="col" class="px-3 py-1 text-right font-medium">
                      {{ t("stats.sent") }}
                    </th>
                    <th scope="col" class="px-3 py-1 text-right font-medium">
                      {{ t("stats.responded") }}
                    </th>
                    <th scope="col" class="py-1 pl-3 text-right font-medium">
                      {{ t("stats.rate") }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-border divide-y">
                  <tr v-for="row in stats.bySource" :key="row.source">
                    <th scope="row" class="py-2 pr-3 font-normal">
                      {{ t(`source.${row.source}`) }}
                    </th>
                    <td class="px-3 py-2 text-right">{{ row.sent }}</td>
                    <td class="px-3 py-2 text-right">{{ row.responded }}</td>
                    <td class="py-2 pl-3 text-right font-semibold">
                      {{ ratio(row.responded, row.sent) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section
            class="border-border bg-surface rounded-lg border p-4 shadow-sm"
            aria-labelledby="stats-response-time"
          >
            <h2 id="stats-response-time" class="mb-2 font-semibold">
              {{ t("stats.responseTime") }}
            </h2>
            <template v-if="stats.medianDaysToResponse !== null">
              <p class="text-3xl font-bold tracking-tight">
                {{ t("stats.medianDays", { days: stats.medianDaysToResponse }) }}
              </p>
              <p class="text-ink-muted mt-1 text-sm">{{ t("stats.medianHint") }}</p>
            </template>
            <p v-else class="text-ink-muted text-sm">{{ t("stats.noResponses") }}</p>
          </section>

          <section
            class="border-border bg-surface rounded-lg border p-4 shadow-sm"
            aria-labelledby="stats-stale"
          >
            <h2 id="stats-stale" class="mb-3 font-semibold">{{ t("stats.stale") }}</h2>
            <ul v-if="stats.stale.length" class="divide-border flex flex-col divide-y">
              <li v-for="application in stats.stale" :key="application.id" class="py-2">
                <RouterLink
                  :to="{ name: 'application', params: { id: application.id } }"
                  class="font-medium hover:underline"
                >
                  {{ application.company }}
                </RouterLink>
                <p class="text-ink-muted text-sm">
                  {{ application.position }} ·
                  {{ t("stats.staleDays", { days: application.daysSinceUpdate }) }}
                </p>
              </li>
            </ul>
            <p v-else class="text-ink-muted text-sm">{{ t("stats.noStale") }}</p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
