// Guards rules that lint cannot see, because they live outside src/.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const SIGNING_MATERIAL =
  /(^|\/)(\.env(\.(development|staging|production))?|keystore\.properties|google-services\.json|GoogleService-Info\.plist)$|\.(jks|p8|p12|mobileprovision)$|(^|\/)(?!debug\.keystore$)[^/]*\.keystore$/;

const checks = [
  {
    name: 'no AsyncStorage anywhere in the dependency tree',
    passes: () => !read('yarn.lock').includes('async-storage'),
  },
  {
    // Keystore keys do not survive a restore, so restored MMKV data could
    // contradict them.
    name: 'android:allowBackup is false',
    passes: () =>
      read('android/app/src/main/AndroidManifest.xml').includes(
        'android:allowBackup="false"',
      ),
  },
  {
    name: 'no signing material or local env file is tracked',
    passes: () =>
      !execSync('git ls-files', { cwd: root, encoding: 'utf8' })
        .split('\n')
        .some(file => SIGNING_MATERIAL.test(file)),
  },
];

const failed = checks.filter(({ passes }) => !passes());

for (const { name } of failed) {
  console.error(`FAIL ${name}`);
}

console.log(
  `repo checks: ${checks.length - failed.length}/${checks.length} passed`,
);
process.exitCode = failed.length === 0 ? 0 : 1;
