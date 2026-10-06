const { RuleTester } = require('eslint');
const rule = require('../no-worklet-object-capture');

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } });

// RuleTester si describe/it zakládá sám (Jest globály), proto volání na nejvyšší úrovni.
tester.run('no-worklet-object-capture', rule, {
      valid: [
        'const s = useAnimatedStyle(() => ({ opacity: x.value }));',
        'const { spin: a } = spin; useAnimatedReaction(() => a.value, () => {});',
        'Gesture.Pan().onUpdate((e) => { x.set(e.x); });',
        'const r = obj.inner.value;',
        'useEffect(() => { spin.angle.value = 1; }, []);',
      ],
      invalid: [
        // Přesně případ, který shodil mapu na iPhonu (PlateNode před opravou).
        { code: 'useAnimatedReaction(() => spin.spin.value, () => {});', errors: 1 },
        { code: 'const d = useDerivedValue(() => clock.value + spin.angle.value);', errors: 1 },
        { code: 'Gesture.Pan().onUpdate(() => { state.pad.set(1); });', errors: 1 },
        { code: 'useAnimatedStyle(() => ({ opacity: field.touch.get() }));', errors: 1 },
      ],
});
