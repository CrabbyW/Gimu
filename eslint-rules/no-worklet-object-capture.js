// Worklet smí zachytit jen sdílené hodnoty a čísla. Zachycený objekt se kopíruje na UI vlákno celý — když obsahuje
// Gesture nebo funkci, nativ spadne („[Worklets] Cannot copy value of type PanGesture“; web worklety nekopíruje, takže
// se chyba ukáže až na telefonu). Pravidlo hlásí `a.b.value` / `a.b.get()` / `a.b.set()` uvnitř workletu:
// sdílenou hodnotu rozbal mimo worklet (`const { b } = a`).

const WORKLET_HOOKS = new Set(['useAnimatedStyle', 'useAnimatedProps', 'useDerivedValue', 'useAnimatedReaction', 'useFrameCallback', 'useAnimatedScrollHandler']);
const GESTURE_METHODS = new Set([
  'onBegin', 'onStart', 'onUpdate', 'onChange', 'onEnd', 'onFinalize',
  'onTouchesDown', 'onTouchesMove', 'onTouchesUp', 'onTouchesCancelled',
]);

/** Je funkce argumentem worklet hooku nebo gesture metody? */
function isWorkletFn(node) {
  const call = node.parent;
  if (!call || call.type !== 'CallExpression' || !call.arguments.includes(node)) return false;
  const callee = call.callee;
  if (callee.type === 'Identifier') return WORKLET_HOOKS.has(callee.name);
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') return GESTURE_METHODS.has(callee.property.name);
  return false;
}

/** `a.b` kde `a` je identifikátor (zachycený objekt). */
const isCapturedMember = (n) => n && n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier';

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Worklet nesmí zachytit objekt (může obsahovat Gesture/funkci → pád na nativu).' },
    messages: {
      capture: 'Worklet zachytává objekt `{{obj}}` (může obsahovat Gesture/funkci → pád na nativu). Rozbal sdílenou hodnotu mimo worklet: `const { {{prop}} } = {{obj}}`.',
    },
    schema: [],
  },
  create(context) {
    let depth = 0;
    // WeakSet místo příznaku na uzlu: pravidlo nesmí měnit AST.
    const worklets = new WeakSet();
    const enter = (node) => { if (isWorkletFn(node)) { worklets.add(node); depth++; } };
    const exit = (node) => { if (worklets.has(node)) depth--; };
    const report = (node, member) => context.report({ node, messageId: 'capture', data: { obj: member.object.name, prop: member.property.name } });
    return {
      ArrowFunctionExpression: enter,
      'ArrowFunctionExpression:exit': exit,
      FunctionExpression: enter,
      'FunctionExpression:exit': exit,
      MemberExpression(node) {
        if (depth === 0 || node.computed || node.property.type !== 'Identifier') return;
        const name = node.property.name;
        if (name === 'value' && isCapturedMember(node.object)) report(node, node.object);
        if ((name === 'get' || name === 'set') && node.parent.type === 'CallExpression' && node.parent.callee === node && isCapturedMember(node.object)) report(node, node.object);
      },
    };
  },
};
