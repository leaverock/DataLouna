import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import * as actions from './actions'
import * as finders from './finders'
import RedisClient from './redis'

const client = new RedisClient('datalouna')


async function routes(fastify: FastifyInstance) {
  fastify.get('/prices', async (request: FastifyRequest, reply: FastifyReply): Promise<{ data: Array<any> }> => {

    let res
    const cacheData = await client.get('prices')

    if (cacheData) {
      res = JSON.parse(cacheData)
    } else {
      res = await finders.products.all()
      await client.set('prices', JSON.stringify(res))
    }

    return { 'data': res }
  });

  fastify.post('/purchases', async (request: FastifyRequest<{
    Body: {
      user_id: number,
      product_id: number,
      amount: number
    }
  }>, reply: FastifyReply) => {
    const res = await actions.users.purchase({
      user_id: request.body.user_id,
      product_id: request.body.product_id,
      amount: request.body.amount
    })
    if (!res) {
      return {
        'message': 'error purchasing product',
      }
    }
    return {
      'message': `${res.user_name} successfully purchased ${res.amount} product(s) for ${res.sum}. User has ${res.new_balance} balance remaining.`,
    }
  })

  fastify.post('/populate_db', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await actions.populate_db()
    return {
      'message': `successfully populated db with ${result} products`,
    }
  })
}

export default routes
