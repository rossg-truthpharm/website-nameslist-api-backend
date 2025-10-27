import {Redis} from '@upstash/redis';

import * as sheetsAPI from '../names/googleSheetsAPI';

import type { VercelRequest, VercelResponse } from '@vercel/node'

const updateRedis = async (redis: Redis, names: String[]): Promise<boolean> => {
    const key = 'names_list';
    const tmp_key = 'names_list_temp';
    try {
        await redis.del(tmp_key);
        // @ts-ignore
        await redis.sadd(tmp_key, ...names);
        await redis.rename(tmp_key, key);
        await redis.set('last_updated', Date.now());
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}

const updateNames = async (): Promise<boolean> => {
    const redis: Redis = Redis.fromEnv();
    const names: String[] = await sheetsAPI.get_names();
    return await updateRedis(redis, names);
}

export async function UPDATE(req: VercelRequest, res: VercelResponse) {
    const authorization = req.headers.authorization;
    if (authorization != `Bearer ${process.env.CRON_SECRET}`) {
        res.status(401).json({success: false, message: 'Authentication failed'});
    }
    if (await updateNames()) {
        res.status(200).json({success: true});
    } else {
        res.status(500).json({success: false});
    }
}