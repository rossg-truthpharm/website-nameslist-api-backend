import { Redis } from '@upstash/redis'

import type { VercelRequest, VercelResponse } from '@vercel/node'

function capitalizeName(name: String): String {
    const splitName: String[] = name.split(' ');
    const capitalizedNames: String[] = splitName.map((name: String): String => {
        if (name.length < 1) {
            return '';
        }
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    });
    return capitalizedNames.join(' ');
}

export async function displayNamesList(req: VercelRequest, res: VercelResponse): Promise<void> {
    const redis = Redis.fromEnv();
    const redisNamesListKey: string = "names_list";
    const redisLastUpdated: string = "last_updated";
    const names: String[] = await redis.smembers(redisNamesListKey);
    const lastUpdatedDateStr: string = await redis.get(redisLastUpdated);
    const lastUpdated = new Date(lastUpdatedDateStr).toDateString();
    const listItems = names.map((name) => `<li>${capitalizeName(name)}</li>`).join('\n');
    const html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Full List</title>
          <style>
            @import url(https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap);
            body { 
              font-family: "Poppins", sans-serif;
              margin: 2rem;
              background-color: #F0EAF6;
            }
            ul { 
              list-style-type: disc;
              padding-left: 20px;
            }
            li { 
              margin-bottom: 8px;
              font-size: 1.1rem;
              }
          </style>
        </head>
        <body>
          <ul>
            ${listItems}
          </ul>
          <p>Last Updated: ${lastUpdated}</p>
        </body>
    </html>`;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}