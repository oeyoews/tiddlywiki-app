import { t } from '@/i18n/index';
import { ipcMain, type BrowserWindow, dialog } from 'electron';

/** handle tw dialog */
export const twDialog = (win: BrowserWindow) => {
  ipcMain.on(
    'custom-dialog',
    (
      event: any,
      {
        type,
        message,
      }: {
        type: DialogType;
        message: string;
      }
    ) => {
      const options = {
        type: type === 'confirm' ? 'question' : 'info',
        buttons:
          type === 'confirm'
            ? [t('dialog.cancel'), t('dialog.confirm')]
            : [t('dialog.confirm')],
        defaultId: type === 'confirm' ? 1 : 0,
        title: t('dialog.confirm'),
        message,
      };
      const result = dialog.showMessageBoxSync(win, options as any);
      event.returnValue = type === 'confirm' ? result === 1 : undefined;
    }
  );
};
