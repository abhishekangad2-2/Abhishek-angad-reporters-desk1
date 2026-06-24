import payload from 'payload';
import config from './src/payload.config.ts';

const init = async () => {
  await payload.init({
    config,
    local: true,
  });
  console.log("Payload initialized, DB should be pushed.");
  process.exit(0);
};

init();
