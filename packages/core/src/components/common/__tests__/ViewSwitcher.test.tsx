import { render, screen } from '@testing-library/preact';

import ViewSwitcher from '@/components/common/ViewSwitcher';
import { CalendarApp } from '@/core/CalendarApp';
import { createAgendaView } from '@/factories/createAgendaView';
import { createDayView } from '@/factories/createDayView';
import { createWeekView } from '@/factories/createWeekView';
import { LocaleProvider } from '@/locale';

describe('ViewSwitcher Agenda localization', () => {
  it('renders localized agenda label when custom locale dictionary is active', () => {
    const app = new CalendarApp({
      views: [createDayView(), createWeekView(), createAgendaView()],
      locale: {
        code: 'zh',
        messages: {
          agenda: '日程',
          day: '天',
          week: '周',
        },
      },
    });

    render(
      <LocaleProvider locale={app.state.locale}>
        <ViewSwitcher calendar={app} mode='buttons' />
      </LocaleProvider>
    );

    expect(screen.getByText('日程')).toBeTruthy();
    expect(screen.getByText('天')).toBeTruthy();
    expect(screen.getByText('周')).toBeTruthy();
  });
});
