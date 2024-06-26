import { Args, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../../infrastructure/prisma.service';
import Utils from '../../utils';
import { VisualizationViewType } from '../../schemas/graphql.autogenerated';
import {
  AllocationTarget,
  getMetadata,
} from '../services/carbon-asset-allocation';
import { Public } from '../../auth/auth.public.decorator';

type StockItem = {
  project: AllocationTarget;
  quantity: number;
  available: number;
};

@Resolver('stock')
export class StockResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Query('getStock')
  async getStock(@Args('view') view: any, @Args('pagination') pagination: any) {
    const stock = await this.resolveStock(view);
    return Utils.paginate(stock, pagination);
  }

  async resolveStock(view: VisualizationViewType): Promise<StockItem[]> {
    let where = null;
    if (view?.project_id) {
      where = {
        projectId: view.project_id,
        businessUnitId: null,
        allocationId: null,
      };
    }
    if (view?.business_unit_id) {
      where = {
        businessUnitId: view.business_unit_id,
      };
    }
    if (view?.company_id) {
      where = {
        project: {
          company: {
            id: view.company_id,
          },
        },
        allocationId: null,
      };
    }

    const stock = await this.prisma.stock.findMany({
      where,
      include: { project: true },
      orderBy: [{ vintage: 'asc' }],
    });
    return stock.map((s) => ({
      project: {
        id: s.projectId,
        name: s.project.name,
        metadata: getMetadata(s.project.metadata),
      },
      vintage: s.vintage,
      quantity: s.quantity,
      available: s.available,
    }));
  }
}
