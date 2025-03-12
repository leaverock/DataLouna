import _ from 'lodash'

import sql from './db'
import * as finders from './finders'


export const users = Object.freeze({
  async purchase({
    user_id,
    product_id,
    amount,
  }: {
    user_id: number,
    product_id: number,
    amount: number,
  }): Promise<{
    user_id: number,
    product_id: number,
    amount: number,
    sum: number,
    new_balance: number,
    user_name: string,
  } | null> {
    return sql.begin(async sql => {
      const price = await finders.products.price_by_id(product_id)
      const sum = amount * price
      if (!await finders.users.can_afford(user_id, sum)) {
        return null
      }
      if (!await finders.products.amount_in_stock(user_id, amount)) {
        return null
      }

      const res = await sql`
        INSERT INTO
          purchase(user_id, product_id, sum, amount)
        VALUES
          (${user_id}, ${product_id}, ${sum}, ${amount})
        RETURNING *
        `

      await sql`
        UPDATE product
          SET quantity = quantity - ${amount}
        WHERE id = ${product_id}
        `

      const user = await sql`
        UPDATE "user"
          SET balance = balance - ${sum}
        WHERE id = ${user_id}
        RETURNING *
        `
      return res?.[0] ? {
        user_id: res[0].user_id,
        product_id: res[0].product_id,
        amount: res[0].amount,
        sum: res[0].sum,
        new_balance: user[0].balance,
        user_name: user[0].name
      } : null
    })
  }
})

export async function populate_db(): Promise<number> {
  return sql.begin(async sql => {
    await sql`drop table if exists "purchase";`
    await sql`drop table if exists "product";`
    await sql`drop table if exists "user";`
    await sql`CREATE TABLE IF NOT EXISTS "user" (
      id SERIAL PRIMARY KEY,
      name varchar(255) NOT NULL,
      balance real NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );`
    await sql`INSERT INTO "user" (name, balance) VALUES 
      ('user1', 1000), 
      ('user2', 2000), 
      ('user3', 10000), 
      ('user4', 50000);
    `
    await sql`CREATE TABLE IF NOT EXISTS product (
      id SERIAL PRIMARY KEY,
      name text NOT NULL UNIQUE,
      tradable_min_price real,
      not_tradable_min_price real,
      quantity integer,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );`
    await sql`CREATE TABLE IF NOT EXISTS purchase (
      id SERIAL PRIMARY KEY,
      user_id integer NOT NULL REFERENCES "user",
      product_id integer NOT NULL REFERENCES "product",
      sum real NOT NULL DEFAULT 0,
      amount real NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );`
    console.log('fetching...')
    const [not_tradable, tradable]: [any, any] = await Promise.all([
      fetch('https://api.skinport.com/v1/items?tradable=false').then(res => res.json()),
      fetch('https://api.skinport.com/v1/items?tradable=true').then(res => res.json())
    ])
    console.log('done fetching.')
    // ключ - имя предмета
    const not_tradable_items_by_name = _.mapKeys(not_tradable, item => item.market_hash_name)
    for (let item of tradable) {
      const not_tradable_min_price = not_tradable_items_by_name[item.market_hash_name]?.min_price
      await sql`
          insert into product(name, tradable_min_price, not_tradable_min_price, quantity)
          values (${item.market_hash_name}, ${not_tradable_min_price}, ${item.min_price}, ${item.quantity})
        `
      // удаляем предмет из массива неторгуемых предметов
      delete not_tradable_items_by_name[item.market_hash_name]
    }
    // вставляем предметы, которыми нельзя торговать, если такие остались
    for (let name in not_tradable_items_by_name) {
      await sql`
          insert into product(name, not_tradable_min_price)
          values (${name}, ${not_tradable_items_by_name[name].min_price})
        `
    }
    return tradable.length + Object.keys(not_tradable_items_by_name).length
  })
}
