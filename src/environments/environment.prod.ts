/* export const environment = {
  production: true
};
 */

import type { AppEnv } from './environment.model';

export const environment: AppEnv = {
  production: true,
  baseAdminUrl: 'https://on-energy.kr', // placeholder until backend confirms
  baseUserUrl: 'https://on-energy.kr',
  imageUrl: 'https://bipv-dev.s3.ap-northeast-2.amazonaws.com/',
  imagePath: '/var/www/public/image/', // server path, or remove if unused in frontend
};
