import {Redis} from '@upstash/redis';

import * as sheetsAPI from '../names/googleSheetsAPI';

import type { VercelRequest, VercelResponse } from '@vercel/node'


const redis: Redis = Redis.fromEnv();
let names: String[];

const fill_redis = async (): Promise<void> => {
    await redis.del('names_list');
    await redis.del('last_updated');
    // @ts-ignore
    await redis.sadd('names_list', ...names);
    await redis.set('last_updated', Date.now());
}


export async function setup(req: VercelRequest, res: VercelResponse) {
    const secret = process.env.DB_SETUP_SECRET;

    console.log(`Env secret: ${secret.toString().trim()}`);
    console.log(`Remove Secret: ${req.query.secret.toString().trim()}`);

    if (req.query.secret.toString().trim() != secret.toString().trim()) {
        res.status(401).json({error: 'unauthorized'});
        return;
    }

    try {
        console.log("Getting names");
        names = await sheetsAPI.get_names();
        console.info(`${names.length}`);
        try {
            await fill_redis();
        } catch (error) {
            console.error(error);
            console.error("Unable to fill redis!");
            res.status(500).json({"success": false});
            return;
        }
        res.status(200).json({"success": true});
    } catch (error) {
        console.error(error);
        console.error("Unable to retrieve names");
        res.status(500).json({"success": false});
        return;
    }
}







