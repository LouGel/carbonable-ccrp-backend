import { ulid } from 'ulid';
import { PrismaService } from '../../prisma.service';
import { PrismaCompanyRepository } from '../company.prisma';
import { BusinessUnit, Company } from '../../../domain/business-unit';
import { createCompany } from './common';

describe('Company Prisma Repository Adapter', () => {
  let prismaService: PrismaService;
  let companyRepository: PrismaCompanyRepository;

  beforeEach(() => {
    prismaService = new PrismaService();
    companyRepository = new PrismaCompanyRepository(prismaService);
  });

  test('should create a company', async () => {
    const company = await createCompany(companyRepository);
    // check that even if company is persisted to db, object can still be constructed from database
    expect(await companyRepository.byId(company.id)).toEqual(company);
  });

  test('should create a company with business units', async () => {
    const company = await createCompany(companyRepository);
    const businessUnitId1 = ulid().toString();
    const businessUnit1 = new BusinessUnit(
      businessUnitId1,
      'Usine',
      "Coeur de l'activité",
      100,
      50,
      0,
      company.id,
      [
        { key: 'type', value: 'factory' },
        { key: 'location', value: 'Paris' },
        { key: 'color', value: 'red' },
      ],
    );
    const businessUnitId2 = ulid().toString();
    const businessUnit2 = new BusinessUnit(
      businessUnitId2,
      'Bureaux',
      'Centre décisionnel',
      50,
      100,
      0,
      company.id,
      [
        { key: 'type', value: 'office' },
        { key: 'location', value: 'Paris' },
        { key: 'color', value: 'blue' },
      ],
    );

    company.addBusinessUnit(businessUnit1);
    company.addBusinessUnit(businessUnit2);

    await companyRepository.save(company);

    const c = await companyRepository.byId(company.id);
    expect(c).toEqual(company);
    expect(c.businessUnits.length).toEqual(2);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });
});
