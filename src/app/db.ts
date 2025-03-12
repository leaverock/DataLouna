import postgres from 'postgres'
import config from '../../config/local.json'

const sql = postgres({
  ...config.pg
})

export default sql
