import 'dotenv/config';
import { createTopics, closeKafka } from '../src/lib/kafka.js';

async function main() {
  console.log('Creating Kafka topics...');
  await createTopics();
  console.log('Kafka topics created successfully');
  await closeKafka();
}

main().catch((err) => { console.error('Kafka error:', err); process.exit(1); });
