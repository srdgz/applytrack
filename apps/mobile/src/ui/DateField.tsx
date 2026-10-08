import type { CalendarDate, FieldIssue } from "@applytrack/core";
import { createFormatter } from "@applytrack/presentation";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import type { Ref } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { View as ViewType } from "react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { Button } from "./Button";

const toDate = (value: string): Date => {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toCalendarDate = (date: Date): string =>
  [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const DateField = ({
  label,
  value,
  max,
  issues,
  onChange,
  fieldRef,
}: {
  readonly label: string;
  readonly value: string;
  readonly max: string;
  readonly issues: readonly FieldIssue[];
  readonly onChange: (value: string) => void;
  readonly fieldRef?: Ref<ViewType>;
}) => {
  const { t, i18n } = useTranslation();
  const format = useMemo(() => createFormatter(i18n.language), [i18n.language]);
  const [open, setOpen] = useState(false);
  const current = value === "" ? toDate(max) : toDate(value);

  const choose = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        maximumDate: toDate(max),
        onValueChange: (_event, date) => {
          onChange(toCalendarDate(date));
        },
      });
      return;
    }
    setOpen((shown) => !shown);
  };

  return (
    <View ref={fieldRef} className="gap-1">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <View className="flex-row flex-wrap items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value === "" ? t("mobile.chooseDate") : format.calendarDate(value as CalendarDate)}`}
          onPress={choose}
          className={`min-h-12 justify-center rounded-md border bg-surface px-3 ${
            issues.length > 0 ? "border-danger" : "border-border"
          }`}
        >
          <Text className="text-base text-ink">
            {value === "" ? t("mobile.chooseDate") : format.calendarDate(value as CalendarDate)}
          </Text>
        </Pressable>
        {value !== "" && (
          <Button
            variant="link"
            label={t("mobile.clearDate")}
            onPress={() => {
              onChange("");
              setOpen(false);
            }}
          />
        )}
      </View>
      {open && Platform.OS !== "android" && (
        <DateTimePicker
          value={current}
          mode="date"
          display="inline"
          maximumDate={toDate(max)}
          onValueChange={(_event, date) => {
            onChange(toCalendarDate(date));
          }}
        />
      )}
      {issues.map((issue) => (
        <Text key={`${issue.field}-${issue.code}`} className="text-sm text-danger">
          {t(`errors.${issue.code}`, { ...issue.meta })}
        </Text>
      ))}
    </View>
  );
};
