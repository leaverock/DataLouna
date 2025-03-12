"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
class RedisClient {
    getChannel(token) {
        return this.prefix + '-channel:' + token;
    }
    constructor(prefix) {
        this.connected = false;
        this.client = (0, redis_1.createClient)({
            url: 'redis://localhost:6379'
        })
            .on('error', (err) => {
            console.log('Error in RedisClient: Failed to createClient');
            console.error(err);
            throw err;
        });
        this.prefix = prefix;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected)
                return;
            this.client.on('error', err => console.error(err));
            yield this.client.connect().catch(err => {
                console.log('Error in RedisClient: Failed to connect');
                console.error(err);
            });
            this.connected = true;
        });
    }
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connect();
            yield this.client.set(this.getChannel(key), value, { EX: 60, NX: true }).catch(err => {
                console.log('Error in RedisClient: Failed to set');
                console.error(err);
            });
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connect();
            return yield this.client.get(this.getChannel(key)).catch(err => {
                console.log('Error in RedisClient: Failed to get');
                console.error(err);
            });
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connect();
            yield this.client.del(this.getChannel(key)).catch(err => {
                console.log('Error in RedisClient: Failed to del');
                console.error(err);
            });
        });
    }
}
exports.default = RedisClient;
