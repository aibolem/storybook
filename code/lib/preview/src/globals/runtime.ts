import * as CHANNELS from '@storybook/core/dist/modules/channels/index';
import * as CLIENT_LOGGER from '@storybook/core/dist/modules/client-logger/index';
import * as CORE_EVENTS from '@storybook/core/dist/modules/events/index';
import * as CORE_EVENTS_PREVIEW_ERRORS from '@storybook/core/dist/modules/events/errors/preview-errors';
import * as PREVIEW_API from '@storybook/preview-api';
import * as TYPES from '@storybook/core/dist/modules/types/index';
import * as GLOBAL from '@storybook/global';

import type { globalsNameReferenceMap } from './globals';

// Here we map the name of a module to their VALUE in the global scope.
export const globalsNameValueMap: Required<Record<keyof typeof globalsNameReferenceMap, any>> = {
  '@storybook/channels': CHANNELS,
  '@storybook/client-logger': CLIENT_LOGGER,
  '@storybook/core-events': CORE_EVENTS,
  '@storybook/core-events/preview-errors': CORE_EVENTS_PREVIEW_ERRORS,
  '@storybook/preview-api': PREVIEW_API,
  '@storybook/global': GLOBAL,
  '@storybook/types': TYPES,
};
