<script setup lang="ts">
import type { ApplicationSnapshot } from "@applytrack/core";
import { isFinalStatus, STALE_AFTER_DAYS, toSummary } from "@applytrack/core";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRouter } from "vue-router";

import { useArchiveDelete } from "../../composables/useArchiveDelete";
import { useFormat } from "../../composables/useFormat";
import { useUseCases } from "../../di/use-cases";
import AppIcon from "../components/AppIcon.vue";
import BackButton from "../components/BackButton.vue";
import StatusBadge from "../components/StatusBadge.vue";
import StatusChangePanel from "../detail/StatusChangePanel.vue";

const props = defineProps<{ id: string }>();

const { t } = useI18n();
const router = useRouter();
const { getApplication, today } = useUseCases();
const { calendarDate, instant, since, salary } = useFormat();

const status = ref<"loading" | "ready" | "not-found" | "error">("loading");
const application = shallowRef<ApplicationSnapshot | null>(null);
const panelOpen = ref(false);
const changeButton = ref<HTMLButtonElement | null>(null);

const load = async () => {
  status.value = "loading";
  panelOpen.value = false;
  try {
    const result = await getApplication.execute({ id: props.id });
    if (result.ok) {
      application.value = result.value;
      status.value = "ready";
    } else if (result.error.code === "UNAUTHENTICATED") {
      await router.replace({ name: "start" });
    } else {
      status.value = "not-found";
    }
  } catch {
    status.value = "error";
  }
};

watch(() => props.id, load, { immediate: true });

const stale = computed(() =>
  application.value ? toSummary(application.value, today()).stale : false,
);

const history = computed(() => [...(application.value?.history ?? [])].reverse());

const details = computed(() => {
  const current = application.value;
  if (!current) return [];
  return [
    { label: t("form.fields.workMode"), value: t(`workMode.${current.workMode}`) },
    { label: t("form.fields.source"), value: t(`source.${current.source}`) },
    { label: t("form.fields.location"), value: current.location },
    {
      label: t("form.groups.salary"),
      value: current.salary ? `${salary(current.salary)} · ${t("form.hints.salary")}` : undefined,
    },
    {
      label: t("form.fields.appliedAt"),
      value: current.appliedAt ? calendarDate(current.appliedAt) : undefined,
    },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
});

const { busy, error: actionError, archive, unarchive, remove } = useArchiveDelete(application);
const archiveButton = ref<HTMLButtonElement | null>(null);
const unarchiveButton = ref<HTMLButtonElement | null>(null);
const deleteButton = ref<HTMLButtonElement | null>(null);
const deleteDialog = ref<HTMLDialogElement | null>(null);
const cancelDelete = ref<HTMLButtonElement | null>(null);

const onArchive = async () => {
  if (await archive()) {
    await nextTick();
    unarchiveButton.value?.focus();
  }
};

const onUnarchive = async () => {
  if (await unarchive()) {
    await nextTick();
    archiveButton.value?.focus();
  }
};

const openDelete = async () => {
  deleteDialog.value?.showModal();
  await nextTick();
  cancelDelete.value?.focus();
};

const closeDelete = () => {
  deleteDialog.value?.close();
};

const onDeleteClosed = () => {
  deleteButton.value?.focus();
};

const confirmDelete = async () => {
  const deleted = await remove();
  if (!deleted) deleteDialog.value?.close();
};

const closePanel = async () => {
  panelOpen.value = false;
  await nextTick();
  changeButton.value?.focus();
};

const onSaved = async (updated: ApplicationSnapshot) => {
  application.value = updated;
  await closePanel();
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 lg:p-6">
    <BackButton :fallback="{ name: 'board' }" />
    <div v-if="status === 'loading'" aria-busy="true" class="flex flex-col gap-4">
      <span class="sr-only">{{ t("feedback.loading") }}</span>
      <div aria-hidden="true" class="bg-surface-muted h-32 animate-pulse rounded-lg" />
      <div aria-hidden="true" class="bg-surface-muted h-64 animate-pulse rounded-lg" />
    </div>

    <div
      v-else-if="status === 'not-found'"
      class="border-border bg-surface rounded-lg border p-6 text-center"
      role="alert"
    >
      <p class="font-semibold">{{ t("form.notFound") }}</p>
      <RouterLink
        :to="{ name: 'board' }"
        class="text-accent mt-3 inline-block font-medium underline underline-offset-2"
      >
        {{ t("form.backToBoard") }}
      </RouterLink>
    </div>

    <div
      v-else-if="status === 'error'"
      class="border-border bg-surface rounded-lg border p-6 text-center"
      role="alert"
    >
      <p class="font-semibold">{{ t("feedback.errorTitle") }}</p>
      <button
        type="button"
        class="bg-accent text-accent-ink mt-4 min-h-10 rounded-md px-4 text-sm font-medium"
        @click="load"
      >
        {{ t("feedback.retry") }}
      </button>
    </div>

    <div
      v-else-if="application"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <header class="border-border bg-surface flex flex-col gap-3 rounded-lg border p-4">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold tracking-tight break-words">{{ application.company }}</h1>
            <p class="text-ink-muted break-words">{{ application.position }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="application.status" />
            <span
              v-if="stale"
              class="bg-warning-soft text-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :title="t('card.staleHint', { days: STALE_AFTER_DAYS })"
            >
              <AppIcon name="clock" class="size-3.5" />
              {{ t("card.stale") }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              v-if="!isFinalStatus(application.status)"
              ref="changeButton"
              type="button"
              class="bg-accent text-accent-ink min-h-11 rounded-md px-4 font-semibold"
              :aria-expanded="panelOpen"
              aria-controls="status-panel"
              @click="panelOpen = !panelOpen"
            >
              {{ t("detail.changeStatus") }}
            </button>
            <p v-else class="text-ink-muted text-sm">{{ t("detail.finalStatus") }}</p>
            <RouterLink
              :to="{ name: 'application-edit', params: { id: application.id } }"
              class="border-border hover:bg-surface-muted inline-flex min-h-11 items-center rounded-md border px-4 font-medium"
            >
              {{ t("detail.edit") }}
            </RouterLink>
          </div>
          <div
            class="border-border flex flex-wrap gap-2 border-t pt-3"
            role="group"
            :aria-label="t('detail.moreActions')"
          >
            <button
              v-if="!application.archived"
              ref="archiveButton"
              type="button"
              class="hover:bg-surface-muted min-h-11 rounded-md px-3 text-sm font-medium"
              :disabled="busy"
              @click="onArchive"
            >
              {{ t("detail.archive") }}
            </button>
            <button
              ref="deleteButton"
              type="button"
              class="text-danger hover:bg-surface-muted min-h-11 rounded-md px-3 text-sm font-medium"
              :disabled="busy"
              @click="openDelete"
            >
              {{ t("detail.delete") }}
            </button>
          </div>
        </header>

        <div
          v-if="application.archived"
          class="bg-warning-soft text-ink flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 text-sm"
        >
          <p>{{ t("detail.archivedNotice") }}</p>
          <button
            ref="unarchiveButton"
            type="button"
            class="border-ink/20 hover:bg-surface min-h-11 rounded-md border px-4 font-medium"
            :disabled="busy"
            @click="onUnarchive"
          >
            {{ t("detail.unarchive") }}
          </button>
        </div>

        <p v-if="actionError" role="alert" class="text-danger text-sm font-medium">
          {{ actionError }}
          <RouterLink :to="{ name: 'board' }" class="ml-1 underline underline-offset-2">
            {{ t("form.backToBoard") }}
          </RouterLink>
        </p>

        <div v-if="panelOpen" id="status-panel">
          <StatusChangePanel :application="application" @saved="onSaved" @cancel="closePanel" />
        </div>

        <section
          class="border-border bg-surface rounded-lg border p-4"
          aria-labelledby="detail-data-title"
        >
          <h2 id="detail-data-title" class="mb-3 font-semibold">{{ t("detail.data") }}</h2>
          <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div v-for="item in details" :key="item.label">
              <dt class="text-ink-muted text-sm">{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </div>
            <div v-if="application.jobUrl" class="sm:col-span-2">
              <dt class="text-ink-muted text-sm">{{ t("form.fields.jobUrl") }}</dt>
              <dd>
                <a
                  :href="application.jobUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  {{ t("detail.openJobUrl") }}
                  <span class="sr-only">{{ t("detail.opensInNewTab") }}</span>
                  <AppIcon name="external" class="size-4" />
                </a>
              </dd>
            </div>
            <div v-if="application.tags.length" class="sm:col-span-2">
              <dt class="text-ink-muted text-sm">{{ t("form.groups.tags") }}</dt>
              <dd>
                <ul class="mt-1 flex flex-wrap gap-1.5">
                  <li
                    v-for="tag in application.tags"
                    :key="tag"
                    class="border-border rounded border px-2 text-sm"
                  >
                    {{ tag }}
                  </li>
                </ul>
              </dd>
            </div>
            <div v-if="application.notes" class="sm:col-span-2">
              <dt class="text-ink-muted text-sm">{{ t("form.groups.notes") }}</dt>
              <dd class="break-words whitespace-pre-line">{{ application.notes }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        class="border-border bg-surface rounded-lg border p-4"
        aria-labelledby="detail-history-title"
      >
        <h2 id="detail-history-title" class="mb-3 font-semibold">{{ t("detail.history") }}</h2>
        <ol class="border-border flex flex-col gap-4 border-l pl-4">
          <li
            v-for="change in history"
            :key="change.changedAt + change.to"
            class="before:bg-accent relative before:absolute before:top-1.5 before:-left-[1.3rem] before:size-2.5 before:rounded-full"
          >
            <p class="font-medium">
              {{
                change.from === null
                  ? t("detail.historyCreated", { to: t(`status.${change.to}`) })
                  : t("detail.historyChange", {
                      from: t(`status.${change.from}`),
                      to: t(`status.${change.to}`),
                    })
              }}
            </p>
            <p class="text-ink-muted text-sm">
              <time :datetime="change.changedAt" :title="instant(change.changedAt)">
                {{ since(change.changedAt, today()) }} · {{ instant(change.changedAt) }}
              </time>
            </p>
            <p v-if="change.note" class="mt-1 text-sm break-words whitespace-pre-line">
              {{ change.note }}
            </p>
          </li>
        </ol>
      </section>
    </div>

    <dialog
      ref="deleteDialog"
      class="bg-surface text-ink m-auto w-full max-w-md rounded-lg p-5 shadow-xl backdrop:bg-black/40"
      aria-labelledby="delete-title"
      aria-describedby="delete-warning"
      @close="onDeleteClosed"
    >
      <div v-if="application" class="flex flex-col gap-4">
        <h2 id="delete-title" class="text-lg font-semibold">
          {{ t("detail.deleteTitle", { company: application.company }) }}
        </h2>
        <p id="delete-warning" class="text-ink-muted text-sm">{{ t("detail.deleteWarning") }}</p>
        <div class="flex flex-wrap justify-end gap-3">
          <button
            ref="cancelDelete"
            type="button"
            class="border-border hover:bg-surface-muted min-h-11 rounded-md border px-4 font-medium"
            @click="closeDelete"
          >
            {{ t("detail.deleteCancel") }}
          </button>
          <button
            type="button"
            class="bg-danger text-danger-ink min-h-11 rounded-md px-4 font-semibold disabled:opacity-70"
            :disabled="busy"
            :aria-busy="busy"
            @click="confirmDelete"
          >
            {{ t("detail.deleteConfirm") }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
