import { getPayload } from 'payload';
import config from './src/payload.config';

async function run() {
  try {
    const payload = await getPayload({ config });
    console.log('Payload initialized successfully! Database schema should be synced.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
