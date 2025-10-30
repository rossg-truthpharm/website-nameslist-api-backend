import { Redis } from '@upstash/redis'
import cors = require('cors');

import {setup} from './setup/dbSetup';
import {UPDATE} from './cron/updateDB';
import {displayNamesList} from "./names/displayFullList";

import type { VercelRequest, VercelResponse } from '@vercel/node'

const app = require('express')();
const redis: Redis = Redis.fromEnv();

app.use(cors());

app.get('/api/setup', async (req: VercelRequest, res: VercelResponse) => {
    await setup(req, res);
})

app.get('/api/cron/updatedb', async (req: VercelRequest, res: VercelResponse) => {
    await UPDATE(req, res);
})

app.get('/api/nameslist', async (req: VercelRequest, res: VercelResponse) => {
    const name = req.query.name.toString().toLowerCase();
    console.log(req.query);
    console.log(name);
    const redis_key_name = 'names_list';
    const hasName = await redis.sismember(redis_key_name, name);
    console.log(hasName);
    if (hasName) {
        res.status(200).json({'found': true})
    } else {
        res.status(200).json({'found': false})
    }
})

app.get('/api/full-list', async (req: VercelRequest, res: VercelResponse) => {
    await displayNamesList(req, res);
})


export default app;


