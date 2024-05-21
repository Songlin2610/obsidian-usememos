import type { Locale } from 'antd/es/locale';
import type { App } from 'obsidian';

// 插件配置类型
export interface PluginSettings {
  dailyNotePath: string;
  dailyRecordHeader: string;
  dailyRecordAPI: string;
  dailyRecordToken: string;
  dailyRecordWarning: boolean;
  weekStart: number;
}

export type DateType = {
  year: number | null;
  month: number | null;
  quarter: number | null;
  week: number | null;
  day: number | null;
};

export type DateRangeType = {
  from: string | null;
  to: string | null;
};

export enum TaskStatusType {
  DONE = 'DONE',
  RECORD = 'RECORD',
}

export type TaskConditionType = {
  status?: TaskStatusType;
  from?: string | null;
  to?: string | null;
};

export type ContextType = {
  app: App;
  settings: PluginSettings;
  locale: Locale;
};

export type ResourceType = {
  name?: string;
  externalLink?: string;
  type?: string;
  uid?: string;
  id: string;
  filename: string;
};

export type DailyRecordType = {
  rowStatus: 'ARCHIVED' | 'ACTIVE' | 'NORMAL';
  updatedTs: number;
  createdTs: number;
  createdAt: string;
  updatedAt: string;
  content: string;
  resourceList?: ResourceType[];
};

export type FetchError = {
  code: number;
  message: string;
  msg?: string;
  error?: string;
};

export enum LogLevel {
  'info',
  'warn',
  'error',
}
