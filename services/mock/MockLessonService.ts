import { EXERCISES } from '@/data/exercises';
import { LESSONS, LESSONS_BY_PATH } from '@/data/lessons';
import { PATHS } from '@/data/paths';
import { STAGE_THRESHOLDS, XP_RULES } from '@/data/xp';
import { applyLessonCompletion } from '@/logic/completion';
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
    const exercises = lesson.exerciseIds.map((eid) => {
      const e: Exercise | undefined = EXERCISES[eid];
      if (!e) throw new Error(`Cvik ${eid} v lekci ${id} neexistuje.`);
      return e;
    });
    return { lesson, exercises };
  }
  async completeLesson(id: string, attemptId: string, now: Date) {
    const profile = useDb.getState().profile;
    if (!profile) throw new Error('Profil neexistuje.');
    const { lesson } = await this.getLesson(id);
    const out = applyLessonCompletion({ profile, lesson, pathLessons: LESSONS_BY_PATH[lesson.pathId], now, attemptId, rules: XP_RULES, thresholds: STAGE_THRESHOLDS });
    if (out.profile !== profile) useDb.getState().setProfile(out.profile);
    return out.result;
  }
}
