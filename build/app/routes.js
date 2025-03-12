"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const actions = __importStar(require("./actions"));
const finders = __importStar(require("./finders"));
const redis_1 = __importDefault(require("./redis"));
const client = new redis_1.default('datalouna');
function routes(fastify, options) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.get('/prices', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let res;
            const cacheData = yield client.get('prices');
            if (cacheData) {
                res = JSON.parse(cacheData);
            }
            else {
                res = yield finders.products.all();
                yield client.set('prices', JSON.stringify(res));
            }
            return { 'data': res };
        }));
        fastify.post('/purchases', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const result = yield actions.users.purchase({
                user_id: request.body.user_id,
                product_id: request.body.product_id,
                amount: request.body.amount
            });
            if (!result.length) {
                return {
                    'message': 'error purchasing product',
                };
            }
            return {
                'message': `successfully purchased ${result.length} product(s)`,
            };
        }));
        fastify.post('/populate_db', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const result = yield actions.populate_db();
            return {
                'message': `successfully populated db with ${result.length} products`,
            };
        }));
    });
}
exports.default = routes;
