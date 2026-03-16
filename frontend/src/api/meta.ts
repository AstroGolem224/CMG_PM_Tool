import client from './client';
import type { RuntimeInfo } from '@/types';

export const metaApi = {
  getRuntime: () =>
    client.get<RuntimeInfo>('/meta/runtime').then((response) => response.data),
};
