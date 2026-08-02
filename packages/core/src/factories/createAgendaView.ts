// Factory function for creating Agenda view
import { h } from 'preact';

import {
  AgendaViewConfig,
  AgendaViewProps,
  ViewAdapterProps,
  ViewFactory,
  ViewType,
} from '@/types';
import AgendaView from '@/views/AgendaView';

import { ViewAdapter } from './ViewAdapter';

const defaultAgendaViewConfig: AgendaViewConfig = {
  daysToShow: 14,
  showEmptyDays: true,
  timeFormat: '24h',
};

const AgendaViewAdapter = (props: AgendaViewProps) =>
  h(ViewAdapter, {
    ...(props as ViewAdapterProps),
    viewType: ViewType.AGENDA,
    originalComponent: AgendaView,
    className: 'df-agenda-view-factory',
  });

AgendaViewAdapter.displayName = 'AgendaViewAdapter';

export const createAgendaView: ViewFactory<AgendaViewConfig> = (
  config = {}
) => {
  const finalConfig = { ...defaultAgendaViewConfig, ...config };

  return {
    type: ViewType.AGENDA,
    ...(config.label ? { label: config.label } : {}),
    component: AgendaViewAdapter,
    config: finalConfig,
  };
};

export default createAgendaView;
