import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from './logger.js';

const TOPICS = [
  'ebg.gl',
  'ebg.graph',
  'ebg.outcomes',
  'ebg.cashflow',
  'ebg.obligations',
  'ebg.scenarios',
  'ebg.tax',
  'ebg.config',
] as const;

export type EBGTopic = typeof TOPICS[number];

export interface EBGEvent<T = unknown> {
  event_id: string;
  event_type: string;
  sequence_number: number;
  idempotency_key: string;
  entity_id: string;
  period_id?: string;
  timestamp: string;
  payload: T;
}

let kafka: Kafka | null = null;
let producer: Producer | null = null;

function getKafka(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: 'ebg-project',
      brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
      retry: { retries: 5 },
    });
  }
  return kafka;
}

export async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = getKafka().producer({
      idempotent: true,
      maxInFlightRequests: 5,
    });
    await producer.connect();
    logger.info('Kafka producer connected');
  }
  return producer;
}

export async function emit(topic: EBGTopic, event: EBGEvent): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic,
    messages: [{
      key: event.entity_id,
      value: JSON.stringify(event),
      headers: {
        event_type: event.event_type,
        idempotency_key: event.idempotency_key,
      },
    }],
  });
}

export async function createConsumer(
  groupId: string,
  topics: EBGTopic[],
  handler: (payload: EachMessagePayload) => Promise<void>,
): Promise<Consumer> {
  const consumer = getKafka().consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topics, fromBeginning: false });
  await consumer.run({ eachMessage: handler });
  logger.info({ groupId, topics }, 'Kafka consumer started');
  return consumer;
}

export async function createTopics(): Promise<void> {
  const admin = getKafka().admin();
  await admin.connect();
  await admin.createTopics({
    topics: TOPICS.map((topic) => ({
      topic,
      numPartitions: 6,
      replicationFactor: 1,
    })),
  });
  logger.info('Kafka topics created');
  await admin.disconnect();
}

export async function closeKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info('Kafka producer disconnected');
  }
}

export { TOPICS };
