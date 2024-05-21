import { App, TFile, TFolder } from 'obsidian';
import type { PluginSettings } from '../type';

import {
  ERROR_MESSAGE,
} from '../constant';
import { logMessage } from '../util';
import { I18N_MAP } from '../i18n';

export class File {
  app: App;
  date: Date;
  settings: PluginSettings;
  locale: string;
  constructor(
    app: App,
    settings: PluginSettings,
    locale: string
  ) {
    this.app = app;
    this.settings = settings;
    this.locale = locale;
  }

  private hasCommonPrefix(tags1: string[], tags2: string[]) {
    for (const tag1 of tags1) {
      for (const tag2 of tags2) {
        if (tag1.startsWith(tag2)) {
          return true;
        }
      }
    }
    return false;
  }

  list(fileFolder: string, condition: { tags: string[] } = { tags: [] }) {
    const folder = this.app.vault.getAbstractFileByPath(fileFolder);

    if (folder instanceof TFolder) {
      const subFolderList = folder.children
        .sort()
        .filter((file) => file instanceof TFolder);
      const IndexList = subFolderList
        .map((subFolder) => {
          // 优先搜索同名文件，否则搜索 XXX.README
          if (subFolder instanceof TFolder) {
            const { name } = subFolder;
            const files = subFolder.children;
            const indexFile = files.find((file) => {
              if ((file as any).basename === name) {
                return true;
              }
              if (file.path.match(/(.*\.)?README\.md/)) {
                return true;
              }
            });

            if (condition.tags.length) {
              const tags = this.tags(indexFile?.path || '');
              // tags: #work/project-1 #work/project-2
              // condition.tags: #work
              if (!this.hasCommonPrefix(tags, condition.tags)) {
                return '';
              }
            }

            if (!indexFile) {
              logMessage(
                I18N_MAP[this.locale][`${ERROR_MESSAGE}}NO_INDEX_FILE_EXIST`] +
                  ' @ ' +
                  subFolder.path
              );
            }

            if (indexFile instanceof TFile) {
              const link = this.app.metadataCache.fileToLinktext(
                indexFile,
                indexFile?.path
              );
              return `[[${link}|${subFolder.name}]]`;
            }
          }
        })
        .filter((link) => !!link)
        .map((link, index: number) => `${index + 1}. ${link}`);

      return IndexList.join('\n');
    }

    return `No files in ${fileFolder}`;
  }

  get(link: string, sourcePath = "", fileFolder?: string) {
    const file = this.app.metadataCache.getFirstLinkpathDest(link, sourcePath);

    if (!fileFolder) {
      return file;
    }

    if (file?.path.includes(fileFolder)) {
      return file;
    }
  }

  tags(filePath: string) {
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      const { frontmatter } = this.app.metadataCache.getFileCache(file) || {
        frontmatter: {},
      };

      let tags = frontmatter?.tags;

      if (!tags) {
        return [];
      }

      if (typeof tags === 'string') {
        tags = [tags];
      }

      return tags.map((tag: string) => tag.replace(/^#(.*)$/, '$1'));
    }
  }
}
