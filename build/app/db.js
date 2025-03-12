"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("postgres"));
const local_json_1 = __importDefault(require("../../config/local.json"));
const sql = (0, postgres_1.default)(Object.assign({}, local_json_1.default.pg));
exports.default = sql;
