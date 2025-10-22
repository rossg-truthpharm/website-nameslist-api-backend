import { Redis } from '@upstash/redis'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const app = require('express')();
const redis: Redis = Redis.fromEnv();

app.get('/', (req: VercelRequest, res: VercelResponse) => {
    res.send('operational');
})

app.get('/api/nameslist', async (req: VercelRequest, res: VercelResponse) => {
    const firstName = req.query.first;
    const lastName = req.query.last;
    //console.log(req.query);
    const nameToSearch = `${firstName.toString().trim()} ${lastName.toString().trim()}`;
    //console.log(nameToSearch);
    const redis_key_name = 'names_list';
    const hasName = await redis.sismember(redis_key_name, nameToSearch.toLowerCase());

    if (hasName) {
        res.json({'has_name': true})
    } else {
        res.json({'has_name': false})
    }
})

export default app;


