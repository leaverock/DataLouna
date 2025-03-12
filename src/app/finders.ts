import sql from './db'


export const products = Object.freeze({
  async all(): Promise<Array<any>> {
    const res = await sql`
    SELECT * FROM product
    `
    return res
  },

  async price_by_id(product_id: number): Promise<number> {
    const res = await sql`
    SELECT tradable_min_price FROM product WHERE id = ${product_id}
    `
    if (!res.length) return 0
    return res[0].tradable_min_price
  },

  async amount_in_stock(product_id: number, amount: number): Promise<boolean> {
    const res = await sql`
    SELECT 1 FROM product WHERE id = ${product_id} AND quantity >= ${amount}
    `
    return res.length == 1
  },
})

export const purchases = Object.freeze({
  async all(): Promise<Array<any>> {
    const res = await sql`
    SELECT * FROM purchase
    `
    return res
  }
})

export const users = Object.freeze({
  async can_afford(user_id: number, sum: number): Promise<boolean> {
    const res = await sql`
    SELECT 1 FROM "user"
    WHERE id = ${user_id} AND balance >= ${sum}
    `
    return res.length == 1
  }
})