import { combineScale } from '@/logic/progression';
import { scaledAmount, scaleFromTest } from '@/logic/fitnessTest';
import { EXERCISES } from '@/data/exercises';
import { EMPTY_DEBT, lessonExtras } from '@/logic/adaptive';
import { LESSONS, LESSONS_BY_PATH } from '@/data/lessons';
import { PATHS } from '@/data/paths';
import { SEASON_RULES, SEASONS } from '@/data/seasons';
import { STAGE_THRESHOLDS, XP_RULES } from '@/data/xp';
import { applyLessonCompletion } from '@/logic/completion';
import { toISODate } from '@/logic/dates';
import { nodeStates, nextLessonId } from '@/logic/map';
import { useDb } from '@/store/db';
import type { Exercise, PathId } from '@/types';
import type { LessonService, LessonPathView } from '../contracts';

export class MockLessonService implements LessonService {
  async getPath(pathId: PathId): Promise<LessonPathView> {
    const lessons = LESSONS_BY_PATH[pathId];
    const completed = new Set(useDb.getState().profile?.activity.map((e) => e.lessonId) ?? []);
    const states = nodeStates(lessons, completed);
    const meta = PATHS[pathId];
    return {
      path: meta,
      currentLessonId: nextLessonId(lessons, completed),
      sections: meta.sections.map((s) => ({
        index: s.index, title: s.title,
        nodes: lessons.filter((l) => l.section === s.index).sort((a, b) => a.order - b.order)
          .map((lesson) => {
            const state = states.get(lesson.id) ?? 'locked';
            const xp = state === 'done' ? XP_RULES.replay : lesson.isBoss ? XP_RULES.boss : XP_RULES.lesson;
            return { lesson, state, exerciseCount: lesson.exerciseIds.length, xp };
          }),
      })),
    };
  }
  async getLesson(id: string) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) throw new Error(`Lekce ${id} neexistuje.`);
    const prof = useDb.getState().profile;
    // Vstupní test × osobní korekce z hodnocení lekcí (UX pass U2).
    const scale = combineScale(scaleFromTest(prof?.fitnessTest), prof?.progression);
    const exercises = lesson.exerciseIds.map((eid) => {
      const e: Exercise | undefined = EXERCISES[eid];
      if (!e) throw new Error(`Cvik ${eid} v lekci ${id} neexistuje.`);
      // Vstupní test (elite fáze 5) škáluje výchozí dávku; dluh se pak počítá z už škálované dávky.
      return { ...e, amount: scaledAmount(e, scale) };
    });
    // Stav uzlu i tady (QA kolo 1) — deep link na zamčenou lekci ji nesmí ani otevřít, ne až při dokončení.
    const completed = new Set(useDb.getState().profile?.activity.map((e) => e.lessonId) ?? []);
    const state = nodeStates(LESSONS_BY_PATH[lesson.pathId], completed).get(lesson.id) ?? 'locked';
    // Dluh z přeskočených cviků navýší cviky této lekce (R44, logic/adaptive.ts).
    const extras = lessonExtras(exercises, useDb.getState().profile?.trainingDebt ?? EMPTY_DEBT);
    return {
      lesson, state, extras, baseAmounts: exercises.map((e) => e.amount),
      exercises: exercises.map((e, i) => ((extras[i] ?? 0) > 0 ? { ...e, amount: e.amount + (extras[i] ?? 0) } : e)),
    };
  }
  async completeLesson(id: string, attemptId: string, now: Date, done?: readonly boolean[]) {
    const profile = useDb.getState().profile;
    if (!profile) throw new Error('Profil neexistuje.');
    const detail = await this.getLesson(id);
    const { lesson } = detail;
    // Spec §7.2: kromě current a dokončených je vše locked — ani deep link nesmí zamčenou lekci započítat.
    const completed = new Set(profile.activity.map((e) => e.lessonId));
    if (nodeStates(LESSONS_BY_PATH[lesson.pathId], completed).get(lesson.id) === 'locked') throw new Error(`Lesson ${id} is locked.`);
    const today = toISODate(now);
    const season = SEASONS.find((s) => s.startDate <= today && today <= s.endDate) ?? null;
    const out = applyLessonCompletion({
      profile, lesson, pathLessons: LESSONS_BY_PATH[lesson.pathId], now, attemptId, rules: XP_RULES, thresholds: STAGE_THRESHOLDS,
      season, repairWindowDays: SEASON_RULES.repairWindowDays,
      outcome: done ? {
        done, extras: detail.extras,
        exercises: detail.exercises.map((e, i) => ({ type: e.type, amount: detail.baseAmounts[i] ?? e.amount })),
      } : undefined,
    });
    if (out.profile !== profile) useDb.getState().setProfile(out.profile);
    return out.result;
  }
}
