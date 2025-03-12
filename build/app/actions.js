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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
exports.populate_db = populate_db;
const lodash_1 = __importDefault(require("lodash"));
const db_1 = __importDefault(require("./db"));
exports.users = Object.freeze({
    purchase(_a) {
        return __awaiter(this, arguments, void 0, function* ({ user_id, product_id, amount, }) {
            const res = yield (0, db_1.default) `
    INSERT INTO
      purchase(user_id, product_id, sum, amount)
    VALUES
      (${user_id}, ${product_id}, ${amount} * (SELECT price FROM product WHERE id = ${product_id}), ${amount})
    RETURNING *
    `;
            return res;
        });
    }
});
function populate_db() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, db_1.default) `
  CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    name varchar(255) NOT NULL,
    balance real NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );
  INSERT INTO "user" (name, balance) VALUES 
    ('user1', 1000), 
    ('user2', 2000), 
    ('user3', 10000), 
    ('user4', 50000);
  
  CREATE TABLE IF NOT EXISTS product (
    id SERIAL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    tradable_min_price real,
    not_tradable_min_price,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );
  
  CREATE TABLE IF NOT EXISTS purchase (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES "user",
    product_id integer NOT NULL REFERENCES "product",
    sum real NOT NULL DEFAULT 0,
    amount real NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );
  `;
        console.log('fetching...');
        const [not_tradable, tradable] = yield Promise.all([
            fetch('https://api.skinport.com/v1/items?tradable=false').then(res => res.json()),
            fetch('https://api.skinport.com/v1/items?tradable=true').then(res => res.json())
        ]);
        console.log('done fetching.');
        // ключ - имя предмета
        const not_tradable_items_by_name = lodash_1.default.mapKeys(not_tradable, item => item.market_hash_name);
        for (let item of tradable) {
            const not_tradable_min_price = (_a = not_tradable_items_by_name[item.market_hash_name]) === null || _a === void 0 ? void 0 : _a.min_price;
            // удаляем предмет из массива неторгуемых предметов
            delete not_tradable_items_by_name[item.market_hash_name];
            yield (0, db_1.default) `
        insert into product(name, tradable_min_price, not_tradable_min_price)
        values (${item.market_hash_name}, ${not_tradable_min_price}, ${item.min_price})
      `;
        }
        // вставляем предметы, которыми нельзя торговать, если такие остались
        for (let name in not_tradable_items_by_name) {
            yield (0, db_1.default) `
        insert into product(name, not_tradable_min_price)
        values (${name}, ${not_tradable_items_by_name[name].min_price})
      `;
        }
        return tradable.length + Object.keys(not_tradable_items_by_name).length;
    });
}
