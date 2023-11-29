/* arquivo SDK para lidar diretamente com a lib do stripe, 
evitando fazer todas as requisições através de metodos HTTP */

import Stripe from 'stripe';
import { version } from '../../package.json'

export const stripe = new Stripe(
  process.env.STRIPE_API_KEY,
  {
    apiVersion: '2020-08-27',
    appInfo: {
      name: 'Ignews',
      version
    }
  }
);