import { createClient } from 'redis'


export default class RedisClient {
  connected = false
  client
  prefix

  getChannel(token: string) {
    return this.prefix + '-channel:' + token;
  }

  constructor(prefix: string) {
    this.client = createClient({
      url: 'redis://localhost:6379'
    })
      .on('error', (err: any) => {
        console.log('Error in RedisClient: Failed to createClient');
        console.error(err);
        throw err;
      });
    this.prefix = prefix;
  }

  async connect() {
    if (this.connected) return;
    this.client.on('error', err => console.error(err));
    await this.client.connect().catch(err => {
      console.log('Error in RedisClient: Failed to connect');
      console.error(err);
      throw err;
    });
    this.connected = true;
  }

  async set(key: string, value: any) {
    await this.connect();
    await this.client.set(this.getChannel(key), value, { EX: 60, NX: true }).catch(err => {
      console.log('Error in RedisClient: Failed to set');
      console.error(err);
    });
  }

  async get(key: string) {
    await this.connect();
    return await this.client.get(this.getChannel(key)).catch(err => {
      console.log('Error in RedisClient: Failed to get');
      console.error(err);
    });
  }

  async del(key: string) {
    await this.connect();
    await this.client.del(this.getChannel(key)).catch(err => {
      console.log('Error in RedisClient: Failed to del');
      console.error(err);
    });
  }
}