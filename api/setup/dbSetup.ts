import {Redis} from '@upstash/redis';

import { RetrieveNames } from '../names/getNames';

import type { VercelRequest, VercelResponse } from '@vercel/node'

const redis: Redis = Redis.fromEnv();
let names: String[];
let rn: RetrieveNames;

const fill_redis = async (): Promise<void> => {
    await redis.del('names_list');
    await redis.del('last_updated');

    await redis.sadd('names_list', names);
    await redis.set('last_updated', Date.now());
}


export function GET(req: VercelRequest, res: VercelResponse) {
    const secret = process.env.DB_SETUP_SECRET;

    if (req.query.secret != secret) {
        res.status(401).json({error: 'unauthorized'});
        return;
    }

    try {
        rn = new RetrieveNames(() => {
            names = rn.getNames();

            //console.info(`${names.length}`);
            try {
                fill_redis().then(() => {});
            } catch (error) {
                console.error(error);
                console.error("Unable to fill redis!");
                res.status(500).json({"success": false});
                return;
            }
        });
    } catch (error) {
        console.error(error);
        console.error("Unable to retrieve names");
        res.status(500).json({"success": false});
        return;
    }
    res.status(200).json({"success": true});
}







