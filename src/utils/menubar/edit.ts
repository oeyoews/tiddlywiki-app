import { type MenuItemConstructorOptions } from 'electron';
import { t } from 'i18next';

export const editMenu = (): MenuItemConstructorOptions => ({
  label: t('menu.edit'),
  submenu: [
    { role: 'undo', label: t('menu.undo') },
    { role: 'redo', label: t('menu.redo') },
    { type: 'separator' },
    { role: 'cut', label: t('menu.cut') },
    { role: 'copy', label: t('menu.copy') },
    { role: 'paste', label: t('menu.paste') },
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
    },
    { type: 'separator' },
    { role: 'delete', label: t('menu.delete') },
    { role: 'selectAll', label: t('menu.selectAll') },
  ],
});
