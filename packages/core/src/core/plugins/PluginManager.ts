import { CalendarAppState, CalendarPlugin, ICalendarApp } from '@/types';
import { logger } from '@/utils/logger';

export class PluginManager {
  constructor(
    private state: CalendarAppState,
    private notify: () => void
  ) {}

  install(plugin: CalendarPlugin, app: ICalendarApp): void {
    if (this.state.plugins.has(plugin.name)) {
      logger.warn(`Plugin ${plugin.name} is already installed`);
      return;
    }
    this.state.plugins.set(plugin.name, plugin);
    plugin.install(app);
  }

  getPlugin<T = unknown>(name: string): T | undefined {
    const plugin = this.state.plugins.get(name);
    return plugin?.api as T;
  }

  hasPlugin(name: string): boolean {
    return this.state.plugins.has(name);
  }

  getPluginConfig(pluginName: string): Record<string, unknown> {
    const plugin = this.state.plugins.get(pluginName);
    return plugin?.config || {};
  }

  updatePluginConfig(
    pluginName: string,
    config: Record<string, unknown>
  ): void {
    const plugin = this.state.plugins.get(pluginName);
    if (plugin) {
      plugin.config = { ...plugin.config, ...config };
      plugin.updateConfig?.(config);
      this.notify();
    }
  }
}
