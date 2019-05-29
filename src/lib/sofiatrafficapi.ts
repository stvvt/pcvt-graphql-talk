import got, { GotJSONFn } from 'got';
import Keyv from 'keyv';
import KeyvFile from 'keyv-file';
import os from 'os';
import { Line, Stop } from "../generated/graphql";

const STOPS_URL = 'https://routes.sofiatraffic.bg/resources/stops-bg.json';
const ARRIVALS_URL = 'https://api-arrivals.sofiatraffic.bg/api/v1/arrivals';

namespace SofiaTraffic {
    export interface Stop {
        y: number;
        n: string;
        x: number;
        c: string;
    }
}

export default class SofiaTraffic {
    private client: got.GotInstance<GotJSONFn>;

    constructor() {
        const cache = new Keyv({
            store: new KeyvFile({
                filename: `${os.tmpdir()}/sofiatraffic.bg`
            })
        });
        this.client = got.extend({
            json: true,
            cache,
            hooks: {
                afterResponse: [
                    (response) => {
                        console.log('Got', response.requestUrl, `[fromCache = ${response.fromCache}]`);
                        return response;
                    }
                ]
            }
        });
    }

    public async stop(code: string): Promise<Stop> {
        const { body }: { body: SofiaTraffic.Stop[] } = (await this.client.get(STOPS_URL));
        const raw = body.find(stop => stop.c === code);
        const res = raw ? { code: raw.c, name: raw.n, lines: [], latitude: raw.x, longitude: raw.y } : null;
        return res;
    }

    public async stops(nameFilter?: string) {
        const { body }: { body: SofiaTraffic.Stop[] } = (await this.client.get(STOPS_URL));

        const allStops = body.map(raw => ({ code: raw.c, name: raw.n, lines: [], latitude: raw.x, longitude: raw.y }));
        if (nameFilter) {
            const nameFilterRegex = new RegExp(`.*${nameFilter}.*`);
            return allStops.filter(stop => stop.name.match(nameFilterRegex));
        }

        return allStops;
    }

    public async lines(stop: Stop): Promise<Line[]> {
        const { body } = await this.client.get(`${ARRIVALS_URL}/${stop.code}/`);
        return body ? body.lines : [];
    }
}