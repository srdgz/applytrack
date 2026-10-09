<script setup lang="ts">
import type { ApplicationStatus, ApplicationSummary, BoardColumnId } from "@applytrack/core";
import {
  canTransition,
  columnForStatus,
  DEFAULT_SORT,
  groupForBoard,
  isFinalStatus,
  MAX_LIMIT,
  statusesForColumn,
} from "@applytrack/core";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useFilters } from "../../composables/useFilters";
import { useMediaQuery } from "../../composables/useMediaQuery";
import { usePagedSearch } from "../../composables/usePagedSearch";
import { useStatusChange } from "../../composables/useStatusChange";
import { useToast } from "../../composables/useToast";
import { columnTone, toApplicationQuery } from "@applytrack/presentation";
import ApplicationCard from "../components/ApplicationCard.vue";
import FilterBar from "../components/FilterBar.vue";
import ResultState from "../components/ResultState.vue";

const { t } = useI18n();
const { filters } = useFilters();
const { change, statusName, transitionMessage } = useStatusChange();
const toast = useToast();
const canDrag = useMediaQuery("(min-width: 48rem) and (pointer: fine)");

const search = usePagedSearch(
  () => ({ ...toApplicationQuery(filters.value), sort: DEFAULT_SORT }),
  MAX_LIMIT,
);
const { items, total, status, showSkeleton } = search;

const columns = computed(() => {
  const selected = filters.value.statuses;
  return groupForBoard(items.value).filter(
    ({ id }) =>
      selected.length === 0 || statusesForColumn(id).some((status) => selected.includes(status)),
  );
});

const columnTitle = (id: BoardColumnId) =>
  id === "closed" ? t("board.closed") : t(`status.${id}`);

const activeTab = ref<BoardColumnId | null>(null);
const tabs = ref<HTMLButtonElement[]>([]);

watch(
  columns,
  (current) => {
    if (current.some(({ id }) => id === activeTab.value)) return;
    activeTab.value = (current.find(({ count }) => count > 0) ?? current[0])?.id ?? null;
  },
  { immediate: true },
);

const activeColumn = computed(() => columns.value.find(({ id }) => id === activeTab.value));

const onTabKeydown = async (event: KeyboardEvent, index: number) => {
  const last = columns.value.length - 1;
  const targets: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  };
  const target = targets[event.key];
  if (target === undefined) return;
  event.preventDefault();
  activeTab.value = columns.value[target]?.id ?? activeTab.value;
  await nextTick();
  tabs.value[target]?.focus();
};

const move = async (application: ApplicationSummary, to: ApplicationStatus) => {
  await change(application.id, to);
};

const dragging = shallowRef<ApplicationSummary | null>(null);
const overColumn = ref<BoardColumnId | null>(null);

const targetsFor = (column: BoardColumnId): ApplicationStatus[] => {
  const current = dragging.value;
  if (!current) return [];
  return statusesForColumn(column).filter((to) => canTransition(current.status, to));
};

const isOwnColumn = (column: BoardColumnId) =>
  dragging.value !== null && columnForStatus(dragging.value.status) === column;

const columnState = (column: BoardColumnId) => {
  if (!dragging.value || isOwnColumn(column)) return "";
  return targetsFor(column).length ? "ring-accent ring-2" : "opacity-50";
};

const dropHint = (column: BoardColumnId) => {
  const targets = targetsFor(column);
  if (overColumn.value !== column || isOwnColumn(column) || !targets.length) return "";
  const [only] = targets;
  return t("board.dropHere", {
    to: targets.length === 1 && only ? statusName(only) : columnTitle(column),
  });
};

const chooser = ref<HTMLDialogElement | null>(null);
const pending = shallowRef<{
  application: ApplicationSummary;
  options: ApplicationStatus[];
} | null>(null);
const chosen = ref<ApplicationStatus | null>(null);

const openChooser = async (application: ApplicationSummary, options: ApplicationStatus[]) => {
  pending.value = { application, options };
  chosen.value = options[0] ?? null;
  await nextTick();
  chooser.value?.showModal();
};

const confirmChooser = async () => {
  const current = pending.value;
  chooser.value?.close();
  pending.value = null;
  if (current && chosen.value) await move(current.application, chosen.value);
};

const cancelChooser = () => {
  chooser.value?.close();
  pending.value = null;
};

const onDragStart = (application: ApplicationSummary) => {
  dragging.value = application;
};

const onDragEnd = () => {
  dragging.value = null;
  overColumn.value = null;
};

const onDragOver = (event: DragEvent, column: BoardColumnId) => {
  if (!dragging.value) return;
  event.preventDefault();
  overColumn.value = column;
};

const onDrop = async (event: DragEvent, column: BoardColumnId) => {
  event.preventDefault();
  const application = dragging.value;
  onDragEnd();
  if (!application || columnForStatus(application.status) === column) return;

  const targets = statusesForColumn(column).filter((to) => canTransition(application.status, to));
  const [only] = targets;
  if (!targets.length)
    toast.warning(t("notify.moveBlockedTitle"), {
      description: transitionMessage(application.status, columnTitle(column)),
    });
  else if (targets.length === 1 && only) await move(application, only);
  else await openChooser(application, targets);
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4 lg:p-6">
    <h1 class="text-2xl font-bold tracking-tight">{{ t("board.title") }}</h1>
    <FilterBar />

    <p
      v-if="total > MAX_LIMIT"
      class="bg-warning-soft text-ink rounded-md p-3 text-sm"
      role="status"
    >
      {{ t("board.tooMany", { total }) }}
    </p>

    <ResultState
      :status="status"
      :show-skeleton="showSkeleton"
      :total="total"
      :has-items="items.length > 0"
      @retry="search.reload"
    >
      <div class="md:hidden">
        <div
          role="tablist"
          :aria-label="t('board.columnsLabel')"
          class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
        >
          <button
            v-for="(column, index) in columns"
            :id="`tab-${column.id}`"
            :key="column.id"
            ref="tabs"
            type="button"
            role="tab"
            :aria-selected="column.id === activeTab"
            :aria-controls="`tabpanel-${column.id}`"
            :tabindex="column.id === activeTab ? 0 : -1"
            :data-tone="columnTone(column.id)"
            class="border-border bg-surface text-ink-muted aria-selected:text-ink inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium aria-selected:border-(--tone) aria-selected:bg-(--tone-soft)"
            @click="activeTab = column.id"
            @keydown="onTabKeydown($event, index)"
          >
            <span aria-hidden="true" class="size-2 rounded-full bg-(--tone)" />
            {{ columnTitle(column.id) }}
            <span class="text-xs font-semibold text-(--tone)">{{ column.count }}</span>
          </button>
        </div>
        <div
          v-if="activeColumn"
          :id="`tabpanel-${activeColumn.id}`"
          role="tabpanel"
          :aria-labelledby="`tab-${activeColumn.id}`"
          tabindex="0"
          class="mt-2"
        >
          <ol v-if="activeColumn.count" class="flex flex-col gap-3">
            <li v-for="application in activeColumn.items" :key="application.id">
              <ApplicationCard
                :application="application"
                :show-status="activeColumn.id === 'closed'"
                movable
                @move="move(application, $event)"
              />
            </li>
          </ol>
          <p v-else class="text-ink-muted py-6 text-center text-sm">{{ t("board.emptyColumn") }}</p>
        </div>
      </div>

      <div class="hidden gap-4 overflow-x-auto pb-4 md:flex lg:overflow-visible">
        <section
          v-for="column in columns"
          :key="column.id"
          :aria-labelledby="`column-${column.id}`"
          :data-column="column.id"
          :data-tone="columnTone(column.id)"
          class="bg-surface-muted/70 border-border/60 flex w-72 shrink-0 flex-col rounded-xl border p-3 transition lg:w-auto lg:min-w-0 lg:flex-1"
          :class="columnState(column.id)"
          @dragover="onDragOver($event, column.id)"
          @drop="onDrop($event, column.id)"
        >
          <h2
            :id="`column-${column.id}`"
            class="mb-3 flex items-center justify-between gap-2 px-1 text-sm font-semibold"
          >
            <span
              class="flex min-w-0 items-center gap-2 before:size-2 before:shrink-0 before:rounded-full before:bg-(--tone)"
              >{{ columnTitle(column.id) }}</span
            >
            <span class="rounded-full bg-(--tone-soft) px-2 text-xs leading-5 text-(--tone)">{{
              column.count
            }}</span>
          </h2>
          <p
            v-if="dropHint(column.id)"
            class="border-accent text-accent mb-3 rounded-md border border-dashed p-2 text-center text-sm font-medium"
          >
            {{ dropHint(column.id) }}
          </p>
          <ol v-if="column.count" class="flex flex-col gap-3">
            <li v-for="application in column.items" :key="application.id">
              <ApplicationCard
                :application="application"
                :show-status="column.id === 'closed'"
                movable
                :draggable="canDrag && !isFinalStatus(application.status)"
                @move="move(application, $event)"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
              />
            </li>
          </ol>
          <p v-else class="text-ink-muted py-6 text-center text-sm">{{ t("board.emptyColumn") }}</p>
        </section>
      </div>
    </ResultState>

    <dialog
      ref="chooser"
      class="bg-surface text-ink m-auto w-full max-w-sm rounded-lg p-5 shadow-xl backdrop:bg-black/40"
      aria-labelledby="chooser-title"
      @cancel="pending = null"
    >
      <form v-if="pending" class="flex flex-col gap-4" @submit.prevent="confirmChooser">
        <h2 id="chooser-title" class="font-semibold">
          {{ t("board.chooseClosedTitle", { company: pending.application.company }) }}
        </h2>
        <fieldset class="flex flex-col gap-2">
          <legend class="sr-only">{{ t("detail.newStatus") }}</legend>
          <label
            v-for="option in pending.options"
            :key="option"
            class="border-border has-checked:border-accent has-checked:bg-accent-soft flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3"
          >
            <input
              v-model="chosen"
              type="radio"
              name="closed-status"
              class="accent-accent size-4"
              :value="option"
            />
            {{ statusName(option) }}
          </label>
        </fieldset>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="border-border hover:bg-surface-muted min-h-11 rounded-md border px-4 font-medium"
            @click="cancelChooser"
          >
            {{ t("board.cancelMove") }}
          </button>
          <button
            type="submit"
            class="bg-accent text-accent-ink shadow-accent transition hover:brightness-110 min-h-11 rounded-md px-5 font-semibold"
          >
            {{ t("board.confirmMove") }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>
