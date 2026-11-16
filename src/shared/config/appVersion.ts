import { version } from '../../../package.json';

// The version users see in the stores. package.json is the one place to bump
// it; tools/check-repo.js fails CI if Android or iOS disagree.
export const appVersion: string = version;
