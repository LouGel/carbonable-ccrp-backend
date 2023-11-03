import { Logger } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Project } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma.service';

@Resolver('Project')
export class ProjectResolver {
  private readonly logger = new Logger(ProjectResolver.name);

  constructor(private prisma: PrismaService) {}

  @Query('projects')
  async getProjects() {
    return await this.prisma.project.findMany();
  }
  @Query('projectBy')
  async getCertifierBy(
    @Args('field') field: string,
    @Args('value') value: string,
  ) {
    return this.prisma.project.findFirst({ where: { [field]: value } });
  }

  @ResolveField('carbon_credits')
  async carbonCredits(@Parent() project: Project) {
    const { id } = project;
    return this.prisma.carbonCredit.findMany({ where: { projectId: id } });
  }

  @ResolveField()
  async certifier(@Parent() project: Project) {
    const { certifierId } = project;
    return this.prisma.certifier.findFirst({ where: { id: certifierId } });
  }

  @ResolveField()
  async developper(@Parent() project: Project) {
    const { developperId } = project;
    return this.prisma.developper.findFirst({ where: { id: developperId } });
  }

  @ResolveField()
  async country(@Parent() project: Project) {
    const { countryId } = project;
    return this.prisma.country.findFirst({ where: { id: countryId } });
  }
}
