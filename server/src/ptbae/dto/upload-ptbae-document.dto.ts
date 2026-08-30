import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum PtbaeDocumentTypeInput {
  TECHNICAL_DATA = 'technical_data',
  PRODUCTION_PLAN = 'production_plan',
  BASELINE_EMISSION = 'baseline_emission',
  MITIGATION_PLAN = 'mitigation_plan',
  SUPPORTING_DOCUMENT = 'supporting_document',
}

export class UploadPtbaeDocumentDto {
  @ApiProperty({ enum: PtbaeDocumentTypeInput })
  @IsEnum(PtbaeDocumentTypeInput)
  documentType!: PtbaeDocumentTypeInput;
}
