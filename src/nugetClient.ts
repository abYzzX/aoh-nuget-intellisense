export {
    searchPackages,
    clearPackageCache
} from './packageSearch';

export {
    getVersions,
    clearVersionCache
} from './versionLookup';

import { clearPackageCache } from './packageSearch';
import { clearVersionCache } from './versionLookup';
import { clearHttpCaches } from './nugetHttp';

export function clearCaches(): void {
    clearPackageCache();
    clearVersionCache();
    clearHttpCaches();
}
