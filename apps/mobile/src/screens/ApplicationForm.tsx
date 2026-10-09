import type { ApplicationStatus } from "@applytrack/core";
import {
  APPLICATION_SOURCES,
  CURRENCIES,
  INITIAL_STATUSES,
  LIMITS,
  WORK_MODES,
} from "@applytrack/core";
import type { FieldGroup } from "@applytrack/presentation";
import { createFormatter, groupOf, showsAppliedAt } from "@applytrack/presentation";
import type { ReactNode, RefObject } from "react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ScrollView as ScrollViewType, TextInput, View as ViewType } from "react-native";
import {
  AccessibilityInfo,
  findNodeHandle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { DateField } from "../ui/DateField";
import { TagField } from "../ui/TagField";
import { TextField } from "../ui/TextField";
import type { ApplicationFormState } from "./useApplicationForm";
import { Text } from "../ui/Text";

type Section = "offer" | "process" | "salary" | "tags" | "notes";

const SECTION_OF: Readonly<Record<FieldGroup, Section>> = {
  company: "offer",
  position: "offer",
  jobUrl: "offer",
  source: "offer",
  workMode: "offer",
  location: "offer",
  status: "process",
  appliedAt: "process",
  salary: "salary",
  tags: "tags",
  notes: "notes",
};

const Group = ({
  title,
  children,
  onLayout,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly onLayout: (y: number) => void;
}) => (
  <View
    onLayout={(event) => {
      onLayout(event.nativeEvent.layout.y);
    }}
    className="gap-4 rounded-lg border border-border bg-surface p-4"
  >
    <Text accessibilityRole="header" className="text-base font-semibold text-ink">
      {title}
    </Text>
    {children}
  </View>
);

const ChoiceGroup = ({
  label,
  required,
  options,
  selected,
  onSelect,
  issues,
  groupRef,
}: {
  readonly label: string;
  readonly required?: boolean;
  readonly options: readonly { value: string; label: string }[];
  readonly selected: string;
  readonly onSelect: (value: string) => void;
  readonly issues: readonly {
    field: string;
    code: string;
    meta?: Readonly<Record<string, string | number>>;
  }[];
  readonly groupRef?: RefObject<ViewType | null>;
}) => {
  const { t } = useTranslation();
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">
        {label}
        {required ? <Text className="text-danger"> *</Text> : null}
      </Text>
      <View
        ref={groupRef}
        accessible={false}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row flex-wrap gap-2"
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            role="radio"
            label={option.label}
            selected={selected === option.value}
            onPress={() => {
              onSelect(option.value);
            }}
          />
        ))}
      </View>
      {issues.map((issue) => (
        <Text key={`${issue.field}-${issue.code}`} className="text-sm text-danger">
          {t(`errors.${issue.code}`, { ...issue.meta })}
        </Text>
      ))}
    </View>
  );
};

export interface ApplicationFormHandle {
  readonly revealFirstError: () => void;
}

export const ApplicationForm = forwardRef<
  ApplicationFormHandle,
  {
    readonly form: ApplicationFormState;
    readonly currentStatus?: ApplicationStatus | undefined;
    readonly saving: boolean;
    readonly failure: string | null;
    readonly onSave: () => void;
    readonly onCancel: () => void;
    readonly header: ReactNode;
  }
>(function ApplicationForm(
  { form, currentStatus, saving, failure, onSave, onCancel, header },
  ref,
) {
  const { t, i18n } = useTranslation();
  const format = useMemo(() => createFormatter(i18n.language), [i18n.language]);
  const { values, set, touch, issuesFor } = form;

  const scroll = useRef<ScrollViewType>(null);
  const sectionY = useRef<Partial<Record<Section, number>>>({});
  const inputs = {
    company: useRef<TextInput>(null),
    position: useRef<TextInput>(null),
    jobUrl: useRef<TextInput>(null),
    location: useRef<TextInput>(null),
    salary: useRef<TextInput>(null),
    salaryMax: useRef<TextInput>(null),
    tags: useRef<TextInput>(null),
    notes: useRef<TextInput>(null),
  };
  const anchors = {
    source: useRef<ViewType>(null),
    workMode: useRef<ViewType>(null),
    status: useRef<ViewType>(null),
    appliedAt: useRef<ViewType>(null),
  };

  useImperativeHandle(ref, () => ({
    revealFirstError: () => {
      const first = form.issues[0];
      if (!first) return;
      const group = groupOf(first);
      scroll.current?.scrollTo({ y: Math.max(0, (sectionY.current[SECTION_OF[group]] ?? 0) - 16) });
      AccessibilityInfo.announceForAccessibility(t("mobile.reviewFields"));
      const input = group in inputs ? inputs[group as keyof typeof inputs].current : null;
      if (input) {
        input.focus();
        return;
      }
      const anchor = group in anchors ? anchors[group as keyof typeof anchors].current : null;
      const node = anchor ? findNodeHandle(anchor) : null;
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    },
  }));

  const layout = (section: Section) => (y: number) => {
    sectionY.current[section] = y;
  };

  const salaryPreview =
    values.salaryMin.trim() !== "" || values.salaryMax.trim() !== ""
      ? format.salary({
          ...(Number.isFinite(Number(values.salaryMin)) && values.salaryMin.trim() !== ""
            ? { min: Number(values.salaryMin) }
            : {}),
          ...(Number.isFinite(Number(values.salaryMax)) && values.salaryMax.trim() !== ""
            ? { max: Number(values.salaryMax) }
            : {}),
          currency: values.currency as (typeof CURRENCIES)[number],
        })
      : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-6 p-4 pb-8"
        >
          {header}
          <Text className="text-sm text-ink-muted">{t("form.requiredHint")}</Text>

          <Group title={t("form.groups.offer")} onLayout={layout("offer")}>
            <TextField
              inputRef={inputs.company}
              label={t("form.fields.company")}
              required
              value={values.company}
              onChangeText={(text) => {
                set("company", text);
              }}
              onBlur={() => {
                touch("company");
              }}
              maxLength={LIMITS.company}
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => inputs.position.current?.focus()}
              issues={issuesFor("company")}
            />
            <TextField
              inputRef={inputs.position}
              label={t("form.fields.position")}
              required
              value={values.position}
              onChangeText={(text) => {
                set("position", text);
              }}
              onBlur={() => {
                touch("position");
              }}
              maxLength={LIMITS.position}
              autoCapitalize="sentences"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => inputs.jobUrl.current?.focus()}
              issues={issuesFor("position")}
            />
            <TextField
              inputRef={inputs.jobUrl}
              label={t("form.fields.jobUrl")}
              value={values.jobUrl}
              onChangeText={(text) => {
                set("jobUrl", text);
              }}
              onBlur={() => {
                touch("jobUrl");
              }}
              keyboardType="url"
              placeholder={t("form.placeholders.jobUrl")}
              maxLength={LIMITS.jobUrl}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => inputs.location.current?.focus()}
              issues={issuesFor("jobUrl")}
            />
            <ChoiceGroup
              groupRef={anchors.source}
              label={t("form.fields.source")}
              required
              options={APPLICATION_SOURCES.map((source) => ({
                value: source,
                label: t(`source.${source}`),
              }))}
              selected={values.source}
              onSelect={(source) => {
                set("source", source);
                touch("source");
              }}
              issues={issuesFor("source")}
            />
            <ChoiceGroup
              groupRef={anchors.workMode}
              label={t("form.fields.workMode")}
              required
              options={WORK_MODES.map((mode) => ({ value: mode, label: t(`workMode.${mode}`) }))}
              selected={values.workMode}
              onSelect={(mode) => {
                set("workMode", mode);
                touch("workMode");
              }}
              issues={issuesFor("workMode")}
            />
            <TextField
              inputRef={inputs.location}
              label={t("form.fields.location")}
              value={values.location}
              onChangeText={(text) => {
                set("location", text);
              }}
              onBlur={() => {
                touch("location");
              }}
              placeholder={t("form.placeholders.location")}
              maxLength={LIMITS.location}
              autoCapitalize="words"
              issues={issuesFor("location")}
            />
          </Group>

          <Group title={t("form.groups.process")} onLayout={layout("process")}>
            {currentStatus === undefined ? (
              <ChoiceGroup
                groupRef={anchors.status}
                label={t("form.fields.status")}
                required
                options={INITIAL_STATUSES.map((status) => ({
                  value: status,
                  label: t(`status.${status}`),
                }))}
                selected={values.status}
                onSelect={(status) => {
                  form.setStatus(status);
                }}
                issues={issuesFor("status")}
              />
            ) : (
              <View className="gap-1">
                <Text className="text-sm font-medium text-ink">{t("form.currentStatus")}</Text>
                <Text className="text-base text-ink">{t(`status.${currentStatus}`)}</Text>
                <Text className="text-xs text-ink-muted">{t("form.statusHint")}</Text>
              </View>
            )}
            {showsAppliedAt(values.status) && (
              <DateField
                fieldRef={anchors.appliedAt}
                label={t("form.fields.appliedAt")}
                value={values.appliedAt}
                max={form.today()}
                issues={issuesFor("appliedAt")}
                onChange={(date) => {
                  set("appliedAt", date);
                  touch("appliedAt");
                }}
              />
            )}
          </Group>

          <Group title={t("form.groups.salary")} onLayout={layout("salary")}>
            <Text className="text-xs text-ink-muted">{t("form.hints.salary")}</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  inputRef={inputs.salary}
                  label={t("form.fields.salaryMin")}
                  value={values.salaryMin}
                  onChangeText={(text) => {
                    set("salaryMin", text);
                  }}
                  onBlur={() => {
                    touch("salary");
                  }}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => inputs.salaryMax.current?.focus()}
                  issues={[]}
                />
              </View>
              <View className="flex-1">
                <TextField
                  inputRef={inputs.salaryMax}
                  label={t("form.fields.salaryMax")}
                  value={values.salaryMax}
                  onChangeText={(text) => {
                    set("salaryMax", text);
                  }}
                  onBlur={() => {
                    touch("salary");
                  }}
                  keyboardType="number-pad"
                  issues={[]}
                />
              </View>
            </View>
            <ChoiceGroup
              label={t("form.fields.currency")}
              options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
              selected={values.currency}
              onSelect={(currency) => {
                set("currency", currency);
              }}
              issues={[]}
            />
            {salaryPreview && <Text className="text-sm text-ink">{salaryPreview}</Text>}
            {issuesFor("salary").map((issue) => (
              <Text key={`${issue.field}-${issue.code}`} className="text-sm text-danger">
                {t(`errors.${issue.code}`, { ...issue.meta })}
              </Text>
            ))}
          </Group>

          <Group title={t("form.groups.tags")} onLayout={layout("tags")}>
            <TagField
              inputRef={inputs.tags}
              label={t("form.groups.tags")}
              tags={values.tags}
              issues={issuesFor("tags")}
              onChange={(tags) => {
                set("tags", tags);
                touch("tags");
              }}
              onBlur={() => {
                touch("tags");
              }}
            />
          </Group>

          <Group title={t("form.groups.notes")} onLayout={layout("notes")}>
            <TextField
              inputRef={inputs.notes}
              label={t("form.fields.notes")}
              value={values.notes}
              onChangeText={(text) => {
                set("notes", text);
              }}
              onBlur={() => {
                touch("notes");
              }}
              multiline
              maxLength={LIMITS.notes}
              autoCapitalize="sentences"
              issues={issuesFor("notes")}
            />
            <Text className="self-end text-xs text-ink-muted">
              {t("form.hints.notesCount", { count: values.notes.length, max: LIMITS.notes })}
            </Text>
          </Group>
        </ScrollView>

        <View className="gap-2 border-t border-border bg-surface p-4">
          {failure && (
            <Text accessibilityRole="alert" className="text-sm text-danger">
              {failure}
            </Text>
          )}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label={t("form.cancel")} onPress={onCancel} />
            </View>
            <View className="flex-1">
              <Button
                label={saving ? t("form.saving") : t("form.save")}
                busy={saving}
                onPress={onSave}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});
