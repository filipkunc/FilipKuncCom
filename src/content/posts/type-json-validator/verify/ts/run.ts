// Exercises the exact modules the live demo uses, so the post's snippets are
// shown to actually run: infer a type from a value, generate a validator by
// walking that type with the compiler, then run the validator. `npm run verify`
// captures the output below and the post renders it.
import { inferType } from '../../../../../lib/typeprobe/infer.ts';
import { generateValidator } from '../../../../../lib/typeprobe/generate-validator.ts';

// #region harness
// A sample value, as if it came back from an API.
const sample = {
  login: 'octocat',
  id: 583231,
  name: 'The Octocat',
  public_repos: 8,
  followers: 1500,
};

// 1. Infer a candidate type from the value.
const typeText = inferType(sample);
console.log(typeText);

// 2. Generate a runtime validator by walking that type with the compiler.
const { code, error, validate } = await generateValidator(typeText);
if (error || !validate) throw new Error(error ?? 'no validator produced');
console.log('\n' + code);

// 3. Run it. The original value passes; a wrong-shaped one does not.
const broken = { login: 'octocat', id: '583231' };
console.log('\nvalidate(sample) =>', validate(sample));
console.log('validate(broken) =>', validate(broken));
// #endregion harness
