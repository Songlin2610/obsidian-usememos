import { Plugin, setIcon } from "obsidian";
import type {
	App,
	MarkdownPostProcessorContext,
	PluginManifest,
} from "obsidian";

// 加载自定义组件
import { File } from "./periodic/File";
import { DailyRecord } from "./periodic/DailyRecord";
import { SettingTabView } from "./view/SettingTab";
import { type PluginSettings } from "./type";
import { DEFAULT_SETTINGS } from "./view/SettingTab";
import { ERROR_MESSAGE } from "./constant";
import { renderError } from "./util";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh";
import { I18N_MAP } from "./i18n";

const localeMap: Record<string, any> = {
	en: enUS,
	"en-us": enUS,
	zh: zhCN,
	"zh-cn": zhCN,
};
const locale = window.localStorage.getItem("language") || "en";

export default class PeriodicPARA extends Plugin {
	settings: PluginSettings;
	file: File;
	views: Record<string, any>;
	dailyRecord: DailyRecord;
	timeout: NodeJS.Timeout;
	interval: NodeJS.Timer;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.app = app;
	}

	async onload() {
		// 加载配置
		await this.loadSettings();

		this.loadDailyRecord();
		// 添加侧边栏图标
		const item = this.addRibbonIcon(
			"refresh-cw",
			"Sync Memos",
			this.dailyRecord.sync
		);
		// 设置图标样式
		setIcon(item, "refresh-cw");
		// 添加设置页面
		this.addSettingTab(
			new SettingTabView(this.app, this.settings, this, localeMap[locale])
		);

		const handler = (
			source: keyof typeof this.views,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		) => {
			const view = source.trim() as keyof typeof this.views;
			const legacyView = `${view}ByTime` as keyof typeof this.views;

			if (!view) {
				return renderError(
					this.app,
					I18N_MAP[locale][`${ERROR_MESSAGE}NO_VIEW_PROVIDED`],
					el.createEl("div"),
					ctx.sourcePath
				);
			}

			if (
				!Object.keys(this.views).includes(view) &&
				!Object.keys(this.views).includes(legacyView)
			) {
				return renderError(
					this.app,
					`${
						I18N_MAP[locale][`${ERROR_MESSAGE}NO_VIEW_EXISTED`]
					}: ${view}`,
					el.createEl("div"),
					ctx.sourcePath
				);
			}

			const callback = this.views[view] || this.views[legacyView];

			return callback(view, el, ctx);
		};
		this.registerMarkdownCodeBlockProcessor("LifeOS", handler);
		this.registerMarkdownCodeBlockProcessor("PeriodicPARA", handler); // for backward compatibility
	}
	loadDailyRecord() {
    this.file = new File(this.app, this.settings, locale);
		this.dailyRecord = new DailyRecord(
			this.app,
			this.settings,
			this.file,
			locale
		);
		this.addCommand({
			id: "periodic-para-sync-daily-record",
			name: "Sync Daily Records",
			callback: this.dailyRecord.sync,
		});
		this.addCommand({
			id: "periodic-para-force-sync-daily-record",
			name: "Force Sync Daily Records",
			callback: this.dailyRecord.forceSync,
		});

		clearTimeout(this.timeout);
		clearInterval(this.interval);

		// sync on start
		this.timeout = setTimeout(() => this.dailyRecord.sync(), 15 * 1000);
		// sync every 0.5 hour
		this.interval = setInterval(
			() => this.dailyRecord.sync(),
			0.5 * 60 * 60 * 1000
		);
	}

	onunload() {
		clearTimeout(this.timeout);
		clearInterval(this.interval);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(settings: PluginSettings) {
		await this.saveData(settings);
		this.settings = settings;
		this.loadDailyRecord();
	}
}
