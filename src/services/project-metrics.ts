import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import Utils from "src/utils";

type Percentages = {
    blue_count: string,
    orange_count: string,
    green_count: string,
    avoidance: string,
    removal: string,
}

type KVPercent = {
    key: string,
    value_percent: string,
};

@Injectable()
export class ProjectMetricsService {
    constructor(private prismaClient: PrismaService) { }

    async get() {
        let percentagesArr = await this.prismaClient.$queryRaw<Percentages[]>`
SELECT
    AVG((p.color = 'BLUE')::int) * 100 as blue_count,
    AVG((p.color = 'GREEN')::int) * 100 as green_count,
    AVG((p.color = 'ORANGE')::int) * 100 as orange_count,
    AVG((p.origin = 'DIRECT_PURCHASE')::int) * 100 as avoidance,
    AVG((p.origin = 'FORWARD_FINANCE')::int) * 100 as removal
FROM projects p
LIMIT 1
;
        `;
        let certifiersArr = await this.prismaClient.$queryRaw<KVPercent[]>`
SELECT c.name as key, (count(*) / tablestat.total::float) * 100 AS value_percent
FROM projects p
         INNER JOIN certifier c on c.id = p.certifier_id
         CROSS JOIN (SELECT count(*) AS total FROM projects p) AS tablestat
GROUP BY tablestat.total, c.name
;
        `;

        let countriesArr = await this.prismaClient.$queryRaw<KVPercent[]>`
SELECT c.name as key, (count(*) / tablestat.total::float) * 100 AS value_percent
FROM projects p
INNER JOIN country c on c.id = p.country_id
CROSS JOIN (SELECT count(*) AS total FROM projects p) AS tablestat
GROUP BY tablestat.total, c.name
;
        `;
        let percentages = percentagesArr.shift();
        let standards = certifiersArr.map(c => ({ ...c, value: Utils.formatString({ value: c.value_percent, suffix: '%' }) }));
        let localization = countriesArr.map(c => ({ ...c, value: Utils.formatString({ value: c.value_percent, suffix: '%' }) }));
        return {
            colors: {
                green: {
                    key: 'Forest & Wetland',
                    value: Utils.formatString({ value: percentages.green_count, suffix: '%' }),
                },
                orange: {
                    key: 'Agro & Soil',
                    value: Utils.formatString({ value: percentages.orange_count, suffix: '%' }),
                },
                blue: {
                    key: 'Coasts & Submarine',
                    value: Utils.formatString({ value: percentages.green_count, suffix: '%' }),
                },
            },
            types: {
                avoidance: Utils.formatString({ value: percentages.avoidance, suffix: '%' }),
                removal: Utils.formatString({ value: percentages.removal, suffix: '%' }),
            },
            standards,
            localization,

        }
    }
}