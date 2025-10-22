import {Redis} from '@upstash/redis';

import { RetrieveNames } from '../names/getNames';

import type { VercelRequest, VercelResponse } from '@vercel/node'

const updateRedis = async (redis: Redis, names: String[]): Promise<boolean> => {
    const key = 'names_list';
    const tmp_key = 'names_list_temp';
    try {
        await redis.del(tmp_key);
        await redis.sadd(tmp_key, names);
        await redis.rename(tmp_key, key);
        await redis.set('last_updated', Date.now());
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}

const updateNames = (): boolean => {
    const redis: Redis = Redis.fromEnv();
    const rn: RetrieveNames = new RetrieveNames(() => {
        const names: String[] = rn.getNames();
        updateRedis(redis, names).then((result) => {
            if (!result) {
                return false;
            }
        })
    })
    return true;
}

export function GET(req: VercelRequest, res: VercelResponse) {
    const authorization = req.headers.authorization;
    if (authorization != `Bearer ${process.env.CRON_SECRET}`) {
        res.status(401).json({success: false});
    }
    if (updateNames()) {
        res.status(200).json({success: true});
    } else {
        res.status(500).json({success: false});
    }
}