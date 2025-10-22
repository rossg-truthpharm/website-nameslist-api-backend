import {Redis} from '@upstash/redis';

import { RetrieveNames } from '../api/names/getNames';

const redis: Redis = Redis.fromEnv();
let names: String[];
let rn: RetrieveNames;

const fill_redis = async (): Promise<void> => {
    //await redis.set('lock', 0);
    await redis.del('names_list');
    await redis.del('last_updated');

    await redis.sadd('names_list', names);
    await redis.set('last_updated', Date.now());
}



try {

    rn = new RetrieveNames(() => {
        names = rn.getNames();

        //console.info(`${names.length}`);
        try {
            let f = fill_redis();
        } catch (error) {
            console.error(error);
            throw new Error("Unable to fill redis!");
        }
    });
} catch (error) {
    console.error(error);
    throw new Error("Unable to retrieve names");
}




