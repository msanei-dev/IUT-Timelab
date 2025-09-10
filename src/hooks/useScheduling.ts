import { useState } from 'react';
import type { Schedule, CourseGroup } from '../shared/types';
import { GroupingConfig } from '../grouping';

const api = (window as any).api;

export interface SchedulingOptions {
  minUnits?: number | '';
  maxUnits?: number | '';
  allowSkipping: boolean;
}

export function useScheduling(initialGrouping: GroupingConfig) {
  const [schedules, setSchedules] = useState<Schedule[]>([] as any);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [groupingConfig, setGroupingConfig] = useState<GroupingConfig>(initialGrouping);
  const [options, setOptions] = useState<SchedulingOptions>({ allowSkipping: true });

  // Extended: accept optional courseGroups to forward to genetic solver (future integration)
  const generate = async (selectedDisplay: string[], mapping: Map<string,string>, preferences: any[], courseGroups?: CourseGroup[]) => {
    setLoading(true);
    try {
      const actual = selectedDisplay.map(d => mapping.get(d) || d);
      const result = await api.getRankedSchedules(actual, preferences, groupingConfig.groups.length? groupingConfig: undefined, {
        minUnits: options.minUnits === '' ? 0 : Number(options.minUnits || 0),
        maxUnits: options.maxUnits === '' ? Infinity : Number(options.maxUnits || Infinity),
        allowSkipping: options.allowSkipping,
        scenarioLimit: 10000
      });
      // TODO: when backend genetic integration exposed, switch to api.runGenetic({ courseGroups, courses, ... })
      if (result.schedules?.length) {
        setSchedules(result.schedules);
        setCurrentIdx(0);
      } else {
        setSchedules([] as any);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { schedules, currentIdx, setCurrentIdx, loading, groupingConfig, setGroupingConfig, options, setOptions, generate };
}
